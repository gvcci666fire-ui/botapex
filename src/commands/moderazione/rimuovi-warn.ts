import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { checkPermission } from '../../utils/config';
import { removeWarn } from '../../utils/warnStore';

export const data = new SlashCommandBuilder()
    .setName('rimuovi-warn')
    .setDescription('Rimuove un warn registrato da un utente specifico.')
    .addUserOption(option => option.setName('utente').setDescription('L’utente da cui rimuovere il warn').setRequired(true))
    .addStringOption(option => option.setName('id').setDescription('ID del warn da rimuovere').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!checkPermission(interaction.member, 2)) {
        return interaction.reply({ content: '❌ Solo amministrazione e gestionali possono usare questo comando.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('utente', true);
    const warnId = interaction.options.getString('id', true);

    if (!interaction.guildId) {
        return interaction.reply({ content: '❌ Impossibile identificare il server.', ephemeral: true });
    }

    const removed = removeWarn(interaction.guildId, targetUser.id, warnId);
    const embed = new EmbedBuilder()
        .setColor(removed ? 0x2ecc71 : 0xe74c3c)
        .setTitle(removed ? '✅ Warn rimosso' : '⚠️ Warn non trovato')
        .setDescription(removed ? `Il warn ${warnId} è stato rimosso per ${targetUser}.` : `Nessun warn con ID ${warnId} trovato per ${targetUser}.`)
        .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
}
