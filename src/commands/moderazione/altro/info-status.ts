import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message } from 'discord.js';
import { CONFIG } from '../../../utils/config';

const AUTO_STATUS_UPDATE_MS = 60_000;
const AUTO_STATUS_DURATION_MS = 10 * 60_000;

async function fetchErlcServerStatus() {
    const response = await fetch('https://api.erlc.gg/v2/server?Players=true&Queue=true', {
        headers: {
            'server-key': CONFIG.ERLC_API_KEY,
            'Accept': 'application/json',
            'User-Agent': 'ApexItalyRP-Bot/1.0'
        }
    });

    if (!response.ok) {
        let errorBody = '';
        try {
            errorBody = await response.text();
        } catch {}
        throw new Error(`ERLC status fetch failed: ${response.status}${errorBody ? ` - ${errorBody}` : ''}`);
    }

    const payload = await response.text();
    if (!payload) {
        throw new Error('ERLC response was empty');
    }

    try {
        return JSON.parse(payload);
    } catch {
        return { raw: payload };
    }
}

function buildErlcStatusEmbed(statusData: any) {
    const queueCount = Array.isArray(statusData.Queue) ? statusData.Queue.length : 0;
    const players = Array.isArray(statusData.Players) && statusData.Players.length > 0
        ? statusData.Players.slice(0, 15).map((player: any) => `• ${player.Player ?? player.Name ?? player.username ?? 'Giocatore'}`).join('\n')
        : 'Nessun giocatore online';
    const joinKey = typeof statusData.JoinKey === 'string' && statusData.JoinKey.trim() ? statusData.JoinKey.trim() : 'N/D';
    const joinUrl = joinKey !== 'N/D' ? `https://join.erlc.gg/${encodeURIComponent(joinKey)}` : 'https://erlc.gg';

    return {
        embed: new EmbedBuilder()
            .setTitle('📡 Stato server ER:LC')
            .setColor(CONFIG.COLORS.INFO)
            .setDescription(statusData.Description ? `${statusData.Description}` : undefined)
            .addFields(
                { name: 'Nome server', value: `${statusData.Name ?? 'N/D'}`, inline: true },
                { name: 'Codice per entrare', value: `\`${joinKey}\``, inline: true },
                { name: 'Giocatori', value: `${statusData.CurrentPlayers ?? 0}/${statusData.MaxPlayers ?? 0}`, inline: true },
                { name: 'In coda', value: `${queueCount}`, inline: true },
                { name: 'Giocatori in gioco', value: players, inline: false }
            )
            .setTimestamp(),
        joinUrl
    };
}

export const data = new SlashCommandBuilder()
    .setName('info-status')
    .setDescription('Mostra lo status del server ER:LC con nome, codice di ingresso, giocatori online e coda.');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
        await interaction.reply({ content: '❌ Questo comando può essere usato solo in un server Discord.', ephemeral: true });
        return;
    }

    if (!interaction.memberPermissions?.has('Administrator') && !interaction.memberPermissions?.has('ManageGuild')) {
        await interaction.reply({ content: '❌ Serve permesso di amministratore per usare questo comando.', ephemeral: true });
        return;
    }

    await interaction.deferReply({ ephemeral: false });

    try {
        const statusData = await fetchErlcServerStatus();
        const { embed, joinUrl } = buildErlcStatusEmbed(statusData);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel('Entra')
                .setStyle(ButtonStyle.Link)
                .setURL(joinUrl),
            new ButtonBuilder()
                .setCustomId('info_status_refresh')
                .setLabel('Aggiorna')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
        const statusMessage = await interaction.fetchReply() as Message;

        const refreshStatus = async () => {
            try {
                const statusData = await fetchErlcServerStatus();
                const { embed: updatedEmbed } = buildErlcStatusEmbed(statusData);

                await statusMessage.edit({ embeds: [updatedEmbed], components: [row] });
            } catch (error) {
                console.error('Errore auto-refresh info-status:', error);
            }
        };

        const interval = setInterval(refreshStatus, AUTO_STATUS_UPDATE_MS);
        setTimeout(() => clearInterval(interval), AUTO_STATUS_DURATION_MS);
    } catch (error) {
        console.error('Errore info-status:', error);
        await interaction.editReply({ content: '❌ Errore durante il recupero delle informazioni del server. Riprova più tardi.' });
    }
}
