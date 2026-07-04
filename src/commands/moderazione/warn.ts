import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import { CONFIG, checkPermission } from '../../utils/config';
import { addWarn, getUserWarns } from '../../utils/warnStore';

export const data = new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Sanziona un utente con un ammonimento ufficializzato.')
    .addUserOption(option => option.setName('utente').setDescription('L\'utente da ammonire').setRequired(true))
    .addStringOption(option => option.setName('motivo').setDescription('Il motivo del warn').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.member;
    if (!checkPermission(member, 1)) {
        return interaction.reply({ content: "❌ Non hai i permessi staff per eseguire questo comando.", ephemeral: true });
    }

    const targetUser = interaction.options.getUser('utente');
    const motivo = interaction.options.getString('motivo');
    const warnId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const warnEmbed = new EmbedBuilder()
        .setTitle('⚠️ Warn Ufficiale Emesso')
        .setColor(CONFIG.COLORS.TORINO_RED)
        .setDescription(`Un utente è stato sanzionato all'interno del server.`)
        .addFields(
            { name: '👤 Utente Sanzionato', value: `${targetUser} (${targetUser?.id})`, inline: true },
            { name: '👮 Staffer Responsabile', value: `${interaction.user}`, inline: true },
            { name: '📝 Motivazione', value: `${motivo}`, inline: false },
            { name: '🆔 Warn ID', value: `\`${warnId}\``, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: 'Apex Italy RP • Sistema Sanzioni', iconURL: interaction.guild?.iconURL() || undefined });

    // Invio nel canale specifico dei warn
    const warnChannel = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.WARN_LOGS) as TextChannel;
    if (warnChannel) await warnChannel.send({ embeds: [warnEmbed] });

    // Invio nel canale log di moderazione generale
    const logChannel = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.LOGS_MODERAZIONE) as TextChannel;
    if (logChannel) await logChannel.send({ embeds: [warnEmbed] });

    if (targetUser?.id && interaction.guildId) {
        addWarn(interaction.guildId, {
            id: warnId,
            userId: targetUser.id,
            guildId: interaction.guildId,
            moderatorId: interaction.user.id,
            moderatorTag: interaction.user.tag,
            reason: motivo ?? 'Nessun motivo specificato',
            timestamp: new Date().toISOString(),
            channelId: warnChannel?.id
        });
    }

    // Messaggio DM all'utente
    try {
        await targetUser?.send({ content: `⚠️ Sei stato sanzionato con un **Warn** su **Torino RP**.\n**Motivo:** ${motivo}` });
    } catch (err) {
        console.log("Impossibile inviare DM all'utente.");
    }

    return interaction.reply({ content: `✅ ${targetUser} è stato ammonito con successo. ID warn: \`${warnId}\``, ephemeral: true });
}