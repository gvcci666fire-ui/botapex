import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client } from 'discord.js';
import { CONFIG } from '../../../utils/config';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('depex')
        .setDescription('Retrocede uno staffer a un grado inferiore')
        .addUserOption(opt => opt.setName('utente').setDescription('Lo staffer da retrocedere').setRequired(true))
        .addRoleOption(opt => opt.setName('nuovo_ruolo').setDescription('Il ruolo successivo da assegnare').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Il motivo del depex (obbligatorio)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const utente = interaction.options.getUser('utente');
        const nuovoRuolo = interaction.options.getRole('nuovo_ruolo');
        const motivo = interaction.options.getString('motivo');

        // ⚠️ CANALE PUBBLICO - Comunicazione controllata
        const embedPublic = new EmbedBuilder()
            .setTitle('📉 Nuova Gestione • Depex')
            .setDescription(
                `**Comunicazione Ufficiale**\n\n` 
            )
            .addFields(
                { name: '👤 Staffer', value: `${utente}`, inline: true },
                { name: '📊 Nuovo Grado', value: `${nuovoRuolo?.name || 'N/A'}`, inline: true },
                { name: '⚠️ Motivo Depex', value: `\`\`\`${motivo}\`\`\``, inline: false }
            )
            .setColor('#e67e22')
            .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
            .setAuthor({ name: `Decisione Direzione Staff`, iconURL: interaction.user.displayAvatarURL() })
            .setFooter({ text: 'Apex Italy RP • Provvedimento Ufficiale' })
            .setTimestamp();

        await interaction.reply({ embeds: [embedPublic] });
        }
}
