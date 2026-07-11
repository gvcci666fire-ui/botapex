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
            .setTitle('📈 GESTIONE STAFF • PROMOZIONE')
            .setDescription(
                `**Comunicazione Ufficiale**\n\n` +
                `Gli alti gradi di **Apex Italy RP** comunicano ufficialmente una promozione all'interno dello Staff Team.\n\n` +
                `**Staffer Promosso:** ${utente}\n` +
                `**Nuovo Ruolo:** ${nuovoRuolo?.name || 'N/A'}\n\n` +
                `Per l'ottimo lavoro svolto, la dedizione e la costanza dimostrata, il suddetto membro è stato ufficialmente **PROMOSSO**.`
            )
            .addFields(
                { name: '👤 Nominativo', value: `${utente}`, inline: true },
                { name: '👑 Qualifica Attuale', value: `${nuovoRuolo?.name || 'N/A'}`, inline: true },
                { name: '📋 Motivazione', value: `\`\`\`${motivo}\`\`\``, inline: false }
            )
            .setColor('#9b59b6')
            .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
            .setAuthor({ name: `Decisione Direzione Staff`, iconURL: interaction.user.displayAvatarURL() })
            .setFooter({ text: 'Apex Italy RP • Provvedimento Ufficiale' })
            .setTimestamp();

        await interaction.reply({ embeds: [embedPublblic] });

        // 📋 LOG AMMINISTRATIVO - Con tutte le informazioni sensibili
        const canaleLog = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.LOG_STAFF);
        if (canaleLog?.isTextBased()) {
            const embedLog = new EmbedBuilder()
                .setTitle('📋 ARCHIVIO: PROMOZIONE STAFF')
                .setColor('#8e44ad')
                .addFields(
                    { name: '🔐 Esecutore', value: `${interaction.user}\n\`${interaction.user.id}\``, inline: false },
                    { name: '👤 Soggetto Promosso', value: `${utente}\n\`${utente?.id}\``, inline: false },
                    { name: '👑 Qualifica Nuova', value: `${nuovoRuolo?.name || 'N/A'}`, inline: true },
                    { name: '📊 Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '📝 Motivazione Completa', value: `\`\`\`${motivo}\`\`\``, inline: false }
                )
                .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
                .setFooter({ text: 'Sistema di Registrazione Staff' })
                .setTimestamp();
            await canaleLog.send({ embeds: [embedLog] });
        }
    }
};
