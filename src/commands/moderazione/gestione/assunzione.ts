import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client, Role } from 'discord.js';
import { CONFIG } from '../../../utils/config';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('assunzione')
        .setDescription('Annuncia l\'assunzione di un nuovo membro nello staff')
        .addUserOption(opt => opt.setName('utente').setDescription('Lo staffer assunto').setRequired(true))
        .addRoleOption(opt => opt.setName('ruolo').setDescription('Il ruolo iniziale da assegnare').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const utente = interaction.options.getUser('utente');
        const ruolo = interaction.options.getRole('ruolo');

        // 🔥 GESTIONE LOCALE: Embed ad altissimo impatto visivo
        const embedLocale = new EmbedBuilder()
            .setTitle('📥 NUOVO MEMBRO DELLO STAFF • ASSUNZIONE')
            .setDescription(
                `✨ La direzione di **Apex Italy RP** è lieta di accogliere un nuovo elemento all'interno dello Staff Team.\n\n` +
                `🤝 Diamo il benvenuto a ${utente}, che da oggi coprirà ufficialmente il ruolo di **${ruolo?.name ?? 'Ruolo non disponibile'}**.\n\n` +
                `*Auguriamo al nuovo staffer un buon lavoro e una splendida permanenza all'interno del nostro Team.*`
            )
            .addFields(
                { name: '👤 Operatore Assunto', value: `> ${utente}`, inline: true },
                { name: '💼 Ruolo Conferito', value: `> ${ruolo ?? 'Ruolo non disponibile'}`, inline: true }
            )
            .setColor('#2ecc71') // Verde Smeraldo brillante
            .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
            .setFooter({ text: 'Apex Italy RP • Direzione Staff' })
            .setTimestamp();

        // Invio immediato e pubblico nel canale corrente
        await interaction.reply({ embeds: [embedLocale] });

        // 📑 LOG SEPARATO: Registro amministrativo della direzione
        const canaleLog = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.LOG_STAFF);
        if (canaleLog?.isTextBased()) {
            const embedLog = new EmbedBuilder()
                .setTitle('📑 Logs: ASSUNZIONE STAFF')
                .setColor('#27ae60')
                .addFields(
                    { name: 'Gestore Azione', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
                    { name: 'Soggetto Assunto', value: `${utente} (\`${utente?.id}\`)`, inline: true },
                    { name: 'Ruolo Iniziale', value: `\`${ruolo?.name ?? 'Ruolo non disponibile'}\``, inline: false },
                    { name: 'Canale Esecuzione', value: `${interaction.channel}`, inline: true }
                )
                .setTimestamp();
            await canaleLog.send({ embeds: [embedLog] });
        }
    }
};