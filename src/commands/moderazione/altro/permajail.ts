import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import { CONFIG, checkPermission } from '../../../utils/config';

export const data = new SlashCommandBuilder()
    .setName('perma-jail')
    .setDescription('Registra un ergastolo o detenzione permanente (Perma Jail).')
    .addUserOption(opt => opt.setName('user_discord').setDescription('Utente Discord interessato').setRequired(true))
    .addStringOption(opt => opt.setName('nome').setDescription('Nome del personaggio RP').setRequired(true))
    .addStringOption(opt => opt.setName('cognome').setDescription('Cognome del personaggio RP').setRequired(true))
    .addStringOption(opt => opt.setName('data_di_nascita').setDescription('Data di nascita del PG').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!checkPermission(interaction.member, 1)) return interaction.reply({ content: "❌ Permessi insufficienti.", ephemeral: true });

    const discordUser = interaction.options.getUser('user_discord');
    const nome = interaction.options.getString('nome');
    const cognome = interaction.options.getString('cognome');
    const dataNascita = interaction.options.getString('data_di_nascita');

    const jailEmbed = new EmbedBuilder()
        .setTitle('⛓️ Carcere di Apex • Nuovo Ergastolo')
        .setColor(0xD68910)
        .setDescription(`Il seguente soggetto è stato condannato alla reclusione a tempo indeterminato senza possibilità di cauzione.`)
        .addFields(
            { name: '👤 Detenuto Discord', value: `${discordUser}`, inline: true },
            { name: '📛 Identità IC', value: `**${nome} ${cognome}**`, inline: false },
            { name: '📅 Data Nascita', value: `\`${dataNascita}\``, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Ministero della Giustizia • Apex Italy RP' });

    const channel = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.PERMA_JAIL) as TextChannel;
    if (channel) await channel.send({ embeds: [jailEmbed] });

    return interaction.reply({ content: `✅ Perma-Jail registrato con successo nel canale.`, ephemeral: true });
}