import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { CONFIG, checkPermission } from '../../../utils/config';

export const data = new SlashCommandBuilder()
    .setName('inattività-staff')
    .setDescription('Invia una richiesta formale di inattività dello staff.')
    .addStringOption(opt => opt.setName('inizio').setDescription('Data inizio (es. 05/07)').setRequired(true))
    .addStringOption(opt => opt.setName('fine').setDescription('Data fine (es. 15/07)').setRequired(true))
    .addStringOption(opt => opt.setName('motivazione').setDescription('Motivazione del congedo').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    const inizio = interaction.options.getString('inizio');
    const fine = interaction.options.getString('fine');
    const motivazione = interaction.options.getString('motivazione');

    const reqEmbed = new EmbedBuilder()
        .setTitle('📅 Richiesta Ufficiale - Ferie Staff')
        .setColor(CONFIG.COLORS.INFO)
        .addFields(
            { name: '👤 Richiedente', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: false },
            { name: '📅 Periodo', value: `Dal \`${inizio}\` al \`${fine}\``, inline: false },
            { name: '📝 Motivazione', value: `${motivazione}`, inline: false },
            { name: '⚖️ Stato Richiesta', value: '⏳ **In Attesa di Valutazione Amministrativa**', inline: true }
        )
        .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`inattivita_accetta_${interaction.user.id}`).setLabel('Accetta').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`inattivita_rifiuta_${interaction.user.id}`).setLabel('Rifiuta').setStyle(ButtonStyle.Danger)
    );

    // Mandiamo la richiesta nello stesso canale dei log generici o dove lo staffer esegue il comando, lasciandolo visibile per gli Admin
    return interaction.reply({ embeds: [reqEmbed], components: [row] });
}