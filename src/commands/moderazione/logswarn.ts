import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import { CONFIG, checkPermission } from '../../utils/config';
import { getUserWarns } from '../../utils/warnStore';

export const data = new SlashCommandBuilder()
    .setName('logs-warn')
    .setDescription('Mostra lo storico dei warn di un utente specifico.')
    .addUserOption(option => option.setName('utente').setDescription('L\'utente di cui verificare lo storico').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!checkPermission(interaction.member, 1)) {
        return interaction.reply({ content: "❌ Permessi insufficienti.", ephemeral: true });
    }

    const targetUser = interaction.options.getUser('utente');
    if (!targetUser?.id || !interaction.guildId) {
        return interaction.reply({ content: '❌ Impossibile recuperare i dati dell’utente.', ephemeral: true });
    }

    const warns = getUserWarns(interaction.guildId, targetUser.id);
    const logsEmbed = new EmbedBuilder()
        .setTitle(`📊 Storico Infrazioni • ${targetUser.username}`)
        .setColor(CONFIG.COLORS.INFO)
        .setThumbnail(targetUser.displayAvatarURL() || null)
        .addFields(
            { name: '🔢 Totale Ammonizioni', value: `**${warns.length}** warn registrati.`, inline: false },
            { name: '🗂️ Dettagli Warn', value: warns.length > 0 ? warns.map((warn, i) => `${i + 1}. [${warn.id}] ${warn.reason}`).join('\n') : '*Nessun warn registrato.*' }
        )
        .setTimestamp();
        epheremal: true;

    return interaction.reply({ embeds: [logsEmbed] });
}