import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { CONFIG } from '../../utils/config';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pannello-verifica')
        .setDescription('Invia un pannello di verifica nel canale corrente')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ Solo gli amministratori possono usare questo comando.', flags: ['Ephemeral'] });
        }

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Verifica Richiesta')
            .setDescription('Clicca il pulsante qui sotto per completare la verifica e accedere pienamente al server.')
            .setColor(CONFIG.COLORS.INFO)
            .setTimestamp();

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('verify_member')
                .setLabel('Completa la verifica')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅')
        );

        const channel = interaction.channel as TextChannel | null;
        if (channel) {
            await channel.send({ embeds: [embed], components: [row] });
        }

        await interaction.reply({ content: '✅ Pannello di verifica inviato.', flags: ['Ephemeral'] });
    }
};
