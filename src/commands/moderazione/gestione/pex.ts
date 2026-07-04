import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client } from 'discord.js';
import { CONFIG } from '../../../utils/config';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pex')
        .setDescription('Promuove uno staffer a un grado superiore')
        .addUserOption(opt => opt.setName('utente').setDescription('Lo staffer da promuovere').setRequired(true))
        .addRoleOption(opt => opt.setName('nuovo_ruolo').setDescription('Il nuovo ruolo da assegnare').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const utente = interaction.options.getUser('utente');
        const nuovoRuolo = interaction.options.getRole('nuovo_ruolo');

        // 🔥 GESTIONE LOCALE
        const embedLocale = new EmbedBuilder()
            .setTitle('🚀 Gestione Staff • Promozione')
            .setDescription(
                `⚡ Gli alti gradi comunicano un nuovo provvedimento di uno staff all'interno dello Staff Team di **Apex Italy RP**.\n\n` +
                `Per l'ottimo lavoro svolto, la dedizione e la costanza dimostrata nel tempo, lo staffer ${utente} è stato ufficialmente **PROMOSSO**.\n\n` 
            )
            .addFields(
                { name: '👤 Staffer Promosso', value: `> ${utente}`, inline: true },
                { name: '👑 Nuovo Ruolo', value: `> ${nuovoRuolo ?? 'Ruolo non disponibile'}`, inline: true }
            )
            .setColor('#9b59b6') // Viola Regale/Elite
            .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
            .setFooter({ text: 'Apex Italy RP • Provvedimento Interno' })
            .setTimestamp();

        await interaction.reply({ embeds: [embedLocale] });

        // 📑 LOG SEPARATO
        const canaleLog = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.LOG_STAFF);
        if (canaleLog?.isTextBased()) {
            const embedLog = new EmbedBuilder()
                .setTitle('📑 Logs: PROMOZIONE STAFF')
                .setColor('#8e44ad')
                .addFields(
                    { name: 'Promosso da', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
                    { name: 'Soggetto Promosso', value: `${utente} (\`${utente?.id}\`)`, inline: true },
                    { name: 'Nuovo Ruolo', value: `\`${nuovoRuolo?.name ?? 'Ruolo non disponibile'}\``, inline: false }
                )
                .setTimestamp();
            await canaleLog.send({ embeds: [embedLog] });
        }
    }
};