import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';

const dataFile = path.resolve(__dirname, '..', '..', 'data', 'links.json');

type LinkEntry = { emoji: string; url: string };
interface LinkStore {
    panel?: { channelId: string; messageId: string };
    links: Record<string, LinkEntry>;
}

function ensureFile() {
    const dir = path.dirname(dataFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(dataFile, JSON.stringify({ panel: null, links: {} }, null, 2));
    }
}

function readStore(): LinkStore {
    ensureFile();
    try {
        const raw = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            const legacyLinks = raw && typeof raw === 'object' && !Array.isArray(raw) && 'links' in raw && typeof raw.links === 'object' && raw.links !== null
                ? raw.links
                : raw;

            const links: Record<string, LinkEntry> = {};
            for (const [name, value] of Object.entries(legacyLinks as Record<string, unknown>)) {
                if (typeof value === 'string') {
                    links[name] = { emoji: '🔗', url: value };
                } else if (value && typeof value === 'object' && 'url' in value && typeof (value as any).url === 'string') {
                    links[name] = {
                        emoji: typeof (value as any).emoji === 'string' && (value as any).emoji.trim() ? (value as any).emoji : '🔗',
                        url: (value as any).url
                    };
                }
            }

            return {
                panel: raw?.panel && typeof raw.panel === 'object' ? raw.panel as LinkStore['panel'] : undefined,
                links
            };
        }
    } catch {
        // ignore and fallback
    }

    return { links: {} };
}

function writeStore(store: LinkStore) {
    ensureFile();
    fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
}

function buildPanelEmbed(links: Record<string, LinkEntry>) {
    const embed = new EmbedBuilder()
        .setTitle('🔗 Link Utili • Apex Italy RP')
        .setDescription('Ecco i link secondari disponibili per il server.')
        .setColor('#00b894')
        .setFooter({ text: 'Apex Italy RP' });

    if (Object.keys(links).length === 0) {
        embed.addFields({ name: 'Nessun link presente', value: 'Usa /aggiungi-link per aggiungerne uno.' });
        return embed;
    }

    const lines = Object.entries(links).map(([name, entry]) => `${entry.emoji || '🔗'} • ${name}\n> ${entry.url}`);
    embed.setDescription(`Ecco i link secondari disponibili per il server.\n\n${lines.join('\n\n')}`);
    return embed;
}

async function refreshPanel(interaction: ChatInputCommandInteraction, store: LinkStore) {
    const panel = store.panel;
    const channel = interaction.guild?.channels.cache.get(panel?.channelId ?? interaction.channelId) ?? await interaction.guild?.channels.fetch(panel?.channelId ?? interaction.channelId).catch(() => null);

    if (!channel || !('send' in channel) || !('messages' in channel)) {
        return;
    }

    const embed = buildPanelEmbed(store.links);
    if (panel?.messageId) {
        const message = await (channel as any).messages.fetch(panel.messageId).catch(() => null);
        if (message) {
            await message.edit({ embeds: [embed] });
            return;
        }
    }

    const sent = await (channel as any).send({ embeds: [embed] });
    store.panel = { channelId: sent.channelId, messageId: sent.id };
    writeStore(store);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rimuovi-link')
        .setDescription('Rimuove un link utile dal pannello')
        .addStringOption((option) => option.setName('nome').setDescription('Nome del link da rimuovere').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ Solo gli amministratori possono usare questo comando.', flags: ['Ephemeral'] });
        }

        const name = interaction.options.getString('nome', true);
        const store = readStore();
        if (store.links[name]) {
            delete store.links[name];
            writeStore(store);
            await refreshPanel(interaction, store);
            await interaction.reply({ content: `✅ Link rimosso: ${name}`, flags: ['Ephemeral'] });
        } else {
            await interaction.reply({ content: '⚠️ Link non trovato.', flags: ['Ephemeral'] });
        }
    }
};
