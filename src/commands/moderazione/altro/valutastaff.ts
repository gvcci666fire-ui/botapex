import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import { CONFIG, checkPermission } from '../../../utils/config';
import { truncateSync } from 'fs';

export const data = new SlashCommandBuilder()
    .setName('valuta-staff')
    .setDescription('Lascia una valutazione sul comportamento o l\'operato di uno staffer.')
    .addUserOption(opt => opt.setName('staffer').setDescription('Lo staffer da valutare').setRequired(true))
    .addIntegerOption(opt => opt.setName('voto').setDescription('Voto da 1 a 5').setRequired(true).setMinValue(1).setMaxValue(5))
    .addStringOption(opt => opt.setName('motivo').setDescription('Il motivo della tua valutazione').setRequired(true))
    .addStringOption(opt => opt.setName('anonimo').setDescription('Vuoi rimanere anonimo?').setRequired(true).addChoices(
        { name: 'Sì, nascondi il mio nome', value: 'Sì' },
        { name: 'No, mostra il mio nome', value: 'No' }
    ));

export async function execute(interaction: ChatInputCommandInteraction) {
    const staffer = interaction.options.getUser('staffer');
    const voto = interaction.options.getInteger('voto')!;
    const motivo = interaction.options.getString('motivo');
    const anonimo = interaction.options.getString('anonimo');

    const stelle = '⭐'.repeat(voto);
    const visualUser = anonimo === 'Sì' ? '🕵️ Utente Anonimo' : `${interaction.user.username}`;

    const valEmbed = new EmbedBuilder()
        .setTitle('📈 Nuova Valutazione Staff')
        .setColor(CONFIG.COLORS.INFO)
        .addFields(
            { name: '👮 Staffer Valutato', value: `${staffer}`, inline: true },
            { name: '👤 Recensore', value: `${visualUser}`, inline: false },
            { name: '📊 Valutazione complessiva', value: `${stelle} (${voto}/5)`, inline: false },
            { name: '📝 Commento / Motivazione', value: `${motivo}`, inline: true}
        )
        .setTimestamp()
        .setFooter({ text: 'Valutazione Staff • Apex Italy RP' });

    const channel = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.VALUTA_STAFF) as TextChannel;
    if (channel) await channel.send({ embeds: [valEmbed] });

    return interaction.reply({ content: '✅ Grazie! La tua recensione è stata registrata ed inoltrata alla direzione.', ephemeral: true });
}