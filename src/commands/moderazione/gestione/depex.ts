import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client } from 'discord.js';
import { CONFIG } from '../../../utils/config';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('depex')
        .setDescription('Retrocede uno staffer a un grado inferiore')
        .addUserOption(opt => opt.setName('utente').setDescription('Lo staffer da retrocedere').setRequired(true))
        .addRoleOption(opt => opt.setName('nuovo_ruolo').setDescription('Il ruolo successivo da assegnare').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Il motivo del depex').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const utente = interaction.options.getUser('utente');
        const nuovoRuolo = interaction.options.getRole('nuovo_ruolo');
        const motivo = interaction.options.getString('motivo');

        // 🔥 GESTIONE LOCALE
        const embedLocale = new EmbedBuilder()
            .setTitle('📉 Gestione Staff • Depex')
            .setDescription(
                `⚠️ Gli alti gradi comunicano un nuovo provvedimento di uno staff all'interno dello Staff Team di **Apex Italy RP**.\n\n` +
                `📉 Il suo nuovo ruolo all'interno della gestione è: **${nuovoRuolo?.name ?? 'Ruolo non disponibile'}**.`
            )
            .addFields(
                { name: '👤 Operatore Depexato', value: `> ${utente}`, inline: true },
                { name: '💼 Ruolo Attuale', value: `> ${nuovoRuolo ?? 'Ruolo non disponibile'}`, inline: true }
            )
            .setColor('#e67e22') // Arancione serio / Warning
            .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null) 
            .setFooter({ text: 'Apex Italy RP • Provvedimenti Interni' })
            .setTimestamp();

        await interaction.reply({ embeds: [embedLocale] });

        // 📑 LOG SEPARATO (Il motivo viene inserito solo qui per preservare la privacy dell'utente nel canale comune)
        const canaleLog = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.LOG_STAFF);
        if (canaleLog?.isTextBased()) {
            const embedLog = new EmbedBuilder()
                .setTitle('📑 Logs: DEPEX STAFF')
                .setColor('#d35400')
                .addFields(
                    { name: 'Esecutore', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
                    { name: 'Soggetto Retrocesso', value: `${utente} (\`${utente?.id}\`)`, inline: true },
                    { name: 'Ruolo Assegnato', value: `\`${nuovoRuolo?.name ?? 'Ruolo non disponibile'}\``, inline: true },
                    { name: 'Motivazione Ufficiale', value: `\`\`\`${motivo}\`\`\``, inline: false }
                )
                .setTimestamp();
            await canaleLog.send({ embeds: [embedLog] });
        }
    }
};