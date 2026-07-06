import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, TextChannel, PermissionFlagsBits } from 'discord.js';
import { CONFIG, checkPermission } from '../../utils/config';
import { addFactionWarn } from '../../utils/warnStore';

export const data = new SlashCommandBuilder()
    .setName('warn-fazione')
    .setDescription('Aggiunge un warn di fazione registrato separatamente dai warn utente.')
    .addStringOption(option => option.setName('fazione').setDescription('Nome della fazione').setRequired(true))
    .addStringOption(option => option.setName('motivo').setDescription('Motivo del warn').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!checkPermission(interaction.member, 1)) {
        return interaction.reply({ content: '❌ Non hai i permessi staff per eseguire questo comando.', ephemeral: true });
    }

    const fazione = interaction.options.getString('fazione', true);
    const motivo = interaction.options.getString('motivo', true);
    const warnId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const warnEmbed = new EmbedBuilder()
        .setTitle('⚠️ Warn Fazione Emesso')
        .setColor(CONFIG.COLORS.TORINO_RED)
        .setDescription(`È stato emesso un warn di fazione.`)
        .addFields(
            { name: '🏷️ Fazione', value: fazione, inline: true },
            { name: '👮 Staffer Responsabile', value: `${interaction.user}`, inline: true },
            { name: '📝 Motivazione', value: motivo, inline: false },
            { name: '🆔 Warn ID', value: `\`${warnId}\``, inline: false }
        )
        .setTimestamp();

    const warnChannel = interaction.guild?.channels.cache.get('1521636350049124432') as TextChannel | undefined;
    if (warnChannel) await warnChannel.send({ embeds: [warnEmbed] });

    const logChannel = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.LOGS_MODERAZIONE) as TextChannel | undefined;
    if (logChannel) await logChannel.send({ embeds: [warnEmbed] });

    if (interaction.guildId) {
        addFactionWarn(interaction.guildId, {
            id: warnId,
            guildId: interaction.guildId,
            moderatorId: interaction.user.id,
            moderatorTag: interaction.user.tag,
            reason: motivo,
            timestamp: new Date().toISOString(),
            channelId: warnChannel?.id,
            kind: 'faction',
            factionName: fazione
        });
    }

    return interaction.reply({ content: `✅ Warn di fazione registrato per **${fazione}**. ID warn: \`${warnId}\``, ephemeral: true });
}
