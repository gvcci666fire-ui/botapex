import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client } from 'discord.js';
import { CONFIG } from '../../../utils/config';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pex')
        .setDescription('Promuove uno staffer a un grado superiore')
        .addUserOption(opt => opt.setName('utente').setDescription('Lo staffer da promuovere').setRequired(true))
        .addRoleOption(opt => opt.setName('nuovo_ruolo').setDescription('Il nuovo ruolo da assegnare').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Il motivo della promozione').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const utente = interaction.options.getUser('utente');
        const nuovoRuolo = interaction.options.getRole('nuovo_ruolo');
        const motivo = interaction.options.getString('motivo');

        // 🏢 CANALE PUBBLICO - Comunicazione ufficiale
        const embedPublblic = new EmbedBuilder()
            .setTitle('📈 Nuova Gestione • Pex')
            .setDescription(
                `**Comunicazione Ufficiale**\n\n` 
            )
            .addFields(
                { name: '👤 Staffer', value: `${utente}`, inline: true },
                { name: '👑 Nuovo Grado', value: `${nuovoRuolo?.name || 'N/A'}`, inline: true },
                { name: '📋 Motivazione Pex', value: `\`\`\`${motivo}\`\`\``, inline: false }
            )
            .setColor('#9b59b6')
            .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
            .setAuthor({ name: `Decisione Direzione Staff`, iconURL: interaction.user.displayAvatarURL() })
            .setFooter({ text: 'Apex Italy RP • Provvedimento Ufficiale' })
            .setTimestamp();

        await interaction.reply({ embeds: [embedPublblic] });
    }
};