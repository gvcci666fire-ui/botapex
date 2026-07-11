import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client } from 'discord.js';
import { CONFIG } from '../../../utils/config';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('licenziamento')
        .setDescription('Rimuove definitivamente un membro dall\'organico staff')
        .addUserOption(opt => opt.setName('utente').setDescription('Lo staffer da licenziare').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Il motivo del licenziamento (obbligatorio)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const utente = interaction.options.getUser('utente');
        const motivo = interaction.options.getString('motivo');

        // 🚨 CANALE PUBBLICO - Comunicazione seria e definitiva
        const embedPublic = new EmbedBuilder()
            .setTitle('🚨 LICENZIAMENTO STAFF • RISOLUZIONE CONTRATTO')
            .setDescription(
                `**Comunicazione Ufficiale della Direzione**\n\n` +
                `Gli alti gradi di **Apex Italy RP** comunicano ufficialmente il **licenziamento** di un membro dello Staff Team.\n\n` +
                `**Soggetto Rimosso:** ${utente}\n\n` +
                `La suddetta persona viene sollevata con effetto **IMMEDIATO** da qualunque mansione, incarico, accesso e responsabilità della struttura dello staff.`
            )
            .addFields(
                { name: '👤 Nominativo', value: `${utente}`, inline: false },
                { name: '🚫 Motivo Risoluzione', value: `\`\`\`${motivo}\`\`\``, inline: false },
                { name: '⚠️ Avviso', value: `Provvedimento definitivo e senza appello`, inline: false }
            )
            .setColor('#c0392b')
            .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
            .setAuthor({ name: `Decisione Direzione Staff`, iconURL: interaction.user.displayAvatarURL() })
            .setFooter({ text: 'Apex Italy RP • Provvedimento Ufficiale' })
            .setTimestamp();

        await interaction.reply({ embeds: [embedPublic] });

        // 📋 LOG AMMINISTRATIVO - Archivio risoluzione contrattuale
        const canaleLog = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.LOG_STAFF);
        if (canaleLog?.isTextBased()) {
            const embedLog = new EmbedBuilder()
                .setTitle('📋 ARCHIVIO: LICENZIAMENTO STAFF')
                .setColor('#2c3e50')
                .addFields(
                    { name: '🔐 Esecutore', value: `${interaction.user}\n\`${interaction.user.id}\``, inline: false },
                    { name: '👤 Soggetto Licenziato', value: `${utente}\n\`${utente?.id}\``, inline: false },
                    { name: '🕐 Data e Ora', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '⚖️ Tipo Procedimento', value: `Licenziamento Disciplinare`, inline: true },
                    { name: '🚫 Causa Risoluzione Contratto', value: `\`\`\`${motivo}\`\`\``, inline: false },
                    { name: '📊 Stato', value: `DEFINITIVO - Nessun ricorso possibile`, inline: false }
                )
                .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
                .setFooter({ text: 'Sistema di Registrazione Staff - Riservato e Ufficiale' })
                .setTimestamp();
            await canaleLog.send({ embeds: [embedLog] });
        }
    }
};
