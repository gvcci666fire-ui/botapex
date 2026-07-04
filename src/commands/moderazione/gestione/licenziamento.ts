import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client } from 'discord.js';
import { CONFIG } from '../../../utils/config';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('licenziamento')
        .setDescription('Rimuove definitivamente un membro dall\'organico staff')
        .addUserOption(opt => opt.setName('utente').setDescription('Lo staffer da licenziare').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Il motivo del licenziamento').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const utente = interaction.options.getUser('utente');
        const motivo = interaction.options.getString('motivo');

        // 🔥 GESTIONE LOCALE
        const embedLocale = new EmbedBuilder()
            .setTitle('🚨 Gestione Staff • Licenziamento')
            .setDescription(
                `🚨 Gli alti gradi comunicano un nuovo provvedimento di uno staff all'interno dello Staff Team di **Apex Italy RP**.\n\n` +
                `L'utente viene sollevato con effetto immediato da qualunque mansione, incarico o accesso riservato alla struttura dello staff.\n\n` 
            )
            .addFields(
                { name: '👤 Staffer Rimosso', value: `> ${utente}`, inline: false }
            )
            .setColor('#7f8c8d') // Grigio Scuro / Chiusura definitiva
            .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
            .setFooter({ text: 'Apex Italy RP • Provvedimenti Interni' })
            .setTimestamp();

        await interaction.reply({ embeds: [embedLocale] });

        // 📑 LOG SEPARATO
        const canaleLog = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.LOG_STAFF);
        if (canaleLog?.isTextBased()) {
            const embedLog = new EmbedBuilder()
                .setTitle('📑 Logs: LICENZIAMENTO STAFF')
                .setColor('#2c3e50')
                .addFields(
                    { name: 'Licenziato da', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
                    { name: 'Soggetto Rimosso', value: `${utente} (\`${utente?.id}\`)`, inline: true },
                    { name: 'Causa Risoluzione Contratto', value: `\`\`\`${motivo}\`\`\``, inline: false }
                )
                .setFooter({ text: 'Apex Italy RP • Registro Direzione Staff' })
                .setTimestamp();
            await canaleLog.send({ embeds: [embedLog] });
        }
    }
};