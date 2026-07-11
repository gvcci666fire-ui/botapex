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
            .setTitle('📥 ASSUNZIONE STAFF • NUOVO MEMBRO')
            .setDescription(
                `**Comunicazione Ufficiale della Direzione**\n\n` +
                `La direzione di **Apex Italy RP** è lieta di accogliere un nuovo elemento nello Staff Team.\n\n` +
                `**Nuovo Membro:** ${utente}\n` +
                `**Incarico:** ${ruolo?.name || 'N/A'}\n\n` +
                `Auguriamo al nuovo membro un buon lavoro e una splendida permanenza nel nostro team di eccellenza.`
            )
            .addFields(
                { name: '👤 Nominativo', value: `${utente}`, inline: true },
                { name: '💼 Ruolo Assegnato', value: `${ruolo?.name || 'N/A'}`, inline: true },
                { name: '✨ Motivazione Assunzione', value: `\`\`\`${motivo}\`\`\``, inline: false }
            )
            .setColor('#2ecc71')
            .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
            .setAuthor({ name: `Direzione Apex Italy RP`, iconURL: interaction.guild?.iconURL() || undefined })
            .setFooter({ text: 'Apex Italy RP • Provvedimento Ufficiale' })
            .setTimestamp();

        await interaction.reply({ embeds: [embedPublic] });

        // 📋 LOG AMMINISTRATIVO - Registro assunzioni
        const canaleLog = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.LOG_STAFF);
        if (canaleLog?.isTextBased()) {
            const embedLog = new EmbedBuilder()
                .setTitle('📋 ARCHIVIO: ASSUNZIONE STAFF')
                .setColor('#27ae60')
                .addFields(
                    { name: '🔐 Gestore Operazione', value: `${interaction.user}\n\`${interaction.user.id}\``, inline: false },
                    { name: '👤 Soggetto Assunto', value: `${utente}\n\`${utente?.id}\``, inline: false },
                    { name: '💼 Qualifica Conferita', value: `${ruolo?.name || 'N/A'}`, inline: true },
                    { name: '🕐 Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '📍 Canale Esecuzione', value: `${interaction.channel}`, inline: true },
                    { name: '📝 Motivazione Assunzione', value: `\`\`\`${motivo}\`\`\``, inline: false }
                )
                .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
                .setFooter({ text: 'Sistema di Registrazione Staff' })
                .setTimestamp();
            await canaleLog.send({ embeds: [embedLog] });
        }
    }
};
