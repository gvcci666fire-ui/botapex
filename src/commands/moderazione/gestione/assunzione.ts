import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client } from 'discord.js';
import { CONFIG } from '../../../utils/config';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('assunzione')
        .setDescription('Annuncia l\'assunzione di un nuovo membro nello staff')
        .addUserOption(opt => opt.setName('utente').setDescription('Lo staffer assunto').setRequired(true))
        .addRoleOption(opt => opt.setName('ruolo').setDescription('Il ruolo iniziale da assegnare').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo/motivazioni dell\'assunzione').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const utente = interaction.options.getUser('utente');
        const ruolo = interaction.options.getRole('ruolo');
        const motivo = interaction.options.getString('motivo');

        // 🎉 CANALE PUBBLICO - Celebrazione dell'assunzione
        const embedPublic = new EmbedBuilder()
            .setTitle('📥 Nuova Gestione • Assunzione Staff')
            .setDescription(
                `**Comunicazione Ufficiale della Direzione**\n\n` +
                `La direzione di **Apex Italy RP** è lieta di accogliere un nuovo elemento nello Staff Team.\n\n` + 
                `Auguriamo al nuovo membro un buon lavoro e una splendida permanenza nel nostro team di eccellenza.`
            )
            .addFields(
                { name: '👤 Staffer', value: `${utente}`, inline: true },
                { name: '💼 Ruolo Assegnato', value: `${ruolo?.name || 'N/A'}`, inline: true },
                { name: '✨ Motivo Assunzione', value: `\`\`\`${motivo}\`\`\``, inline: false }
            )
            .setColor('#2ecc71')
            .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
            .setAuthor({ name: `Direzione Apex Italy RP`, iconURL: interaction.guild?.iconURL() || undefined })
            .setFooter({ text: 'Apex Italy RP • Provvedimento Ufficiale' })
            .setTimestamp();

        await interaction.reply({ embeds: [embedPublic] });
    },
};  