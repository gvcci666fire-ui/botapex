import { SlashCommandBuilder, ChatInputCommandInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ForumChannel, MessageFlags } from 'discord.js';
import { CONFIG } from '../../../utils/config';

export const data = new SlashCommandBuilder()
    .setName('consiglia')
    .setDescription('Invia un suggerimento strutturato per migliorare il server.');

export async function execute(interaction: ChatInputCommandInteraction) {
    const modal = new ModalBuilder().setCustomId('modal_consiglio').setTitle('Invia un Consiglio');

    const inputTitolo = new TextInputBuilder().setCustomId('consiglio_testo').setLabel('Il tuo Consiglio').setStyle(TextInputStyle.Paragraph).setRequired(true);
    const inputMotivo = new TextInputBuilder().setCustomId('consiglio_motivo').setLabel('Perché dovremmo aggiungerlo?').setStyle(TextInputStyle.Paragraph).setRequired(true);

    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(inputTitolo),
        new ActionRowBuilder<TextInputBuilder>().addComponents(inputMotivo)
    );

    await interaction.showModal(modal);
}