import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client } from 'discord.js';
import { CONFIG } from '../../../utils/config';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sospensione')
        .setDescription('Sospende temporaneamente uno staffer dalle sue mansioni')
        .addUserOption(opt => opt.setName('utente').setDescription('Lo staffer da sospendere').setRequired(true))
        .addStringOption(opt => opt.setName('durata').setDescription('Durata (es. 3 Giorni, 1 Settimana)').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Il motivo della sospensione').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const utente = interaction.options.getUser('utente');
        const durata = interaction.options.getString('durata');
        const motivo = interaction.options.getString('motivo');

        // 🔥 GESTIONE LOCALE
        const embedLocale = new EmbedBuilder()
            .setTitle('🛑 Gestione Staff • Sospensione')
            .setDescription(
                `🛑 Gli alti gradi comunicano un nuovo provvedimento di uno staff all'interno dello Staff Team di **Apex Italy RP**.\n\n` +
                `L'operatore in questione è rimosso da ogni attività di moderazione e gestione pubblica per la durata stabilita.\n\n` +
                `Per maggiori informazioni, contattare un amministrativo o gestionale.`
            )
            .addFields(
                { name: '👤 Staffer Sospeso', value: `> ${utente}`, inline: true },
                { name: '⏳ Durata Sospensione', value: `> \`${durata}\``, inline: true }
            )
            .setColor('#f1c40f') // Giallo acceso (Pausa/Standby)
            .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
            .setFooter({ text: 'Apex Italy RP • Provvedimento Interno' })
            .setTimestamp();

        await interaction.reply({ embeds: [embedLocale] });

        // 📑 LOG SEPARATO
        const canaleLog = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.LOG_STAFF);
        if (canaleLog?.isTextBased()) {
            const embedLog = new EmbedBuilder()
                .setTitle('📑 Logs: SOSPENSIONE APPLICATA')
                .setColor('#f39c12')
                .addFields(
                    { name: 'Responsabile', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
                    { name: 'Staffer Congelato', value: `${utente} (\`${utente?.id}\`)`, inline: true },
                    { name: 'Tempo Assegnato', value: `\`${durata}\``, inline: true },
                    { name: 'Causa Sospensione', value: `\`\`\`${motivo}\`\`\``, inline: false }
                )
                .setTimestamp();
            await canaleLog.send({ embeds: [embedLog] });
        }
    }
};