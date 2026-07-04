import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client } from 'discord.js';
import { CONFIG } from '../../../utils/config';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('strike')
        .setDescription('Assegna un richiamo ufficiale (Strike) a uno staffer')
        .addUserOption(opt => opt.setName('utente').setDescription('Lo staffer da richiamare').setRequired(true))
        .addStringOption(opt => opt.setName('conteggio').setDescription('Situazione Strike (es. 1/3, 2/3)').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Causa del richiamo ufficiale').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const utente = interaction.options.getUser('utente');
        const conteggio = interaction.options.getString('conteggio');
        const motivo = interaction.options.getString('motivo');

        // 🔥 GESTIONE LOCALE
        const embedLocale = new EmbedBuilder()
            .setTitle('⚠️ Gestione Staff • Strike Staff')
            .setDescription(
                `‼ Gli alti gradi comunicano un nuovo provvedimento di uno staff all'interno dello Staff Team di **Apex Italy RP**.\n\n` +
                `📈 **Stato Richiami Corrente:** \`${conteggio}\``
            )
            .addFields(
                { name: '👤 Operatore Sanzionato', value: `> ${utente}`, inline: true },
                { name: '📊 Situazione Strike', value: `> \`${conteggio}\``, inline: true }
            )
            .setColor('#e74c3c') // Rosso Acceso / Pericolo
            .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
            .setFooter({ text: 'Apex Italy RP • Provvedimento Interno' })
            .setTimestamp();

        await interaction.reply({ embeds: [embedLocale] });

        // 📑 LOG SEPARATO
        const canaleLog = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.LOG_STAFF);
        if (canaleLog?.isTextBased()) {
            const embedLog = new EmbedBuilder()
                .setTitle('📑 Logs: EMISSIONE STRIKE')
                .setColor('#c0392b')
                .addFields(
                    { name: 'Sanzionante', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
                    { name: 'Sanzionato', value: `${utente} (\`${utente?.id}\`)`, inline: true },
                    { name: 'Contatore', value: `\`${conteggio}\``, inline: true },
                    { name: 'Infrazione Commessa', value: `\`\`\`${motivo}\`\`\``, inline: false }
                )
                .setTimestamp();
            await canaleLog.send({ embeds: [embedLog] });
        }
    }
};