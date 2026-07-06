import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { CONFIG, checkPermission } from '../../utils/config';
import { getFactionWarns } from '../../utils/warnStore';

export const data = new SlashCommandBuilder()
    .setName('logs-fazione')
    .setDescription('Mostra i warn di fazione registrati.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!checkPermission(interaction.member, 1)) {
        return interaction.reply({ content: '❌ Permessi insufficienti.', ephemeral: true });
    }

    if (!interaction.guildId) {
        return interaction.reply({ content: '❌ Impossibile identificare il server.', ephemeral: true });
    }

    const factionWarns = getFactionWarns(interaction.guildId);
    const logsEmbed = new EmbedBuilder()
        .setTitle('📊 Storico Warn Fazioni')
        .setColor(CONFIG.COLORS.INFO)
        .addFields(
            { name: '🔢 Totale Warn', value: `**${factionWarns.length}** warn di fazione registrati.`, inline: false },
            { name: '🗂️ Dettagli', value: factionWarns.length > 0 ? factionWarns.map((warn, i) => `${i + 1}. [${warn.id}] ${warn.factionName}: ${warn.reason}`).join('\n') : '*Nessun warn di fazione registrato.*' }
        )
        .setTimestamp();

    return interaction.reply({ embeds: [logsEmbed] });
}
