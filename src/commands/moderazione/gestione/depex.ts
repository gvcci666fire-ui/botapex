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
            .setTitle('📉 GESTIONE STAFF • RETROCESSIONE')
            .setDescription(
                `**Comunicazione Ufficiale**\n\n` +
                `Gli alti gradi di **Apex Italy RP** comunicano ufficialmente una retrocessione all'interno dello Staff Team.\n\n` +
                `**Soggetto Interessato:** ${utente}\n` +
                `**Nuovo Ruolo:** ${nuovoRuolo?.name || 'N/A'}\n\n` +
                `La suddetta persona è stata **RETROCESSA** in seguito a comportamenti inappropriati o mancanza di standard qualitativi richiesti.`
            )
            .addFields(
                { name: '👤 Nominativo', value: `${utente}`, inline: true },
                { name: '📊 Qualifica Nuova', value: `${nuovoRuolo?.name || 'N/A'}`, inline: true },
                { name: '⚠️ Causa', value: `\`\`\`${motivo}\`\`\``, inline: false }
            )
            .setColor('#e67e22')
            .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
            .setAuthor({ name: `Decisione Direzione Staff`, iconURL: interaction.user.displayAvatarURL() })
            .setFooter({ text: 'Apex Italy RP • Provvedimento Ufficiale' })
            .setTimestamp();

        await interaction.reply({ embeds: [embedPublic] });

        // 📋 LOG AMMINISTRATIVO - Dettagliato e sensibile
        const canaleLog = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.LOG_STAFF);
        if (canaleLog?.isTextBased()) {
            const embedLog = new EmbedBuilder()
                .setTitle('📋 ARCHIVIO: RETROCESSIONE STAFF')
                .setColor('#d35400')
                .addFields(
                    { name: '🔐 Esecutore', value: `${interaction.user}\n\`${interaction.user.id}\``, inline: false },
                    { name: '👤 Soggetto Retrocesso', value: `${utente}\n\`${utente?.id}\``, inline: false },
                    { name: '📊 Qualifica Precedente', value: `Sconosciuta (vedi sistema ruoli)`, inline: true },
                    { name: '📉 Qualifica Assegnata', value: `${nuovoRuolo?.name || 'N/A'}`, inline: true },
                    { name: '🕐 Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '📝 Motivazione Dettagliata', value: `\`\`\`${motivo}\`\`\``, inline: false },
                    { name: '⚖️ Gravità', value: `Procedimento Disciplinare`, inline: true }
                )
                .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
                .setFooter({ text: 'Sistema di Registrazione Staff - Riservato' })
                .setTimestamp();
            await canaleLog.send({ embeds: [embedLog] });
        }
    }
};
