import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import { CONFIG, checkPermission } from '../../../utils/config';

export const data = new SlashCommandBuilder()
    .setName('perma-death')
    .setDescription('Registra la morte permanente di un personaggio.')
    .addUserOption(opt => opt.setName('user_discord').setDescription('Utente Discord interessato').setRequired(true))
    .addStringOption(opt => opt.setName('nome').setDescription('Nome del personaggio RP').setRequired(true))
    .addStringOption(opt => opt.setName('cognome').setDescription('Cognome del personaggio RP').setRequired(true))
    .addStringOption(opt => opt.setName('data_di_nascita').setDescription('Data di nascita del PG (GG/MM/AAAA)').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!checkPermission(interaction.member, 1)) return interaction.reply({ content: "❌ Permessi insufficienti.", ephemeral: true });

    const discordUser = interaction.options.getUser('user_discord');
    const nome = interaction.options.getString('nome');
    const cognome = interaction.options.getString('cognome');
    const dataNascita = interaction.options.getString('data_di_nascita');

    const deathEmbed = new EmbedBuilder()
        .setTitle('💀 Cimitero Apex Italy • Nuovo Decesso')
        .setColor(0x1C1C1C)
        .setDescription(`Si dichiara la fine ufficiale della vita del seguente cittadino all'interno del Roleplay.`)
        .addFields(
            { name: '👤 Profilo Discord', value: `${discordUser}`, inline: true },
            { name: '🪦 Nome Personaggio', value: `**${nome} ${cognome}**`, inline: false },
            { name: '📅 Data Nascita IC', value: `\`${dataNascita}\``, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Archivio Stato Civile • Apex Italy RP' });

    const channel = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.PERMA_DEATH) as TextChannel;
    if (channel) await channel.send({ embeds: [deathEmbed] });

    return interaction.reply({ content: `✅ Perma-Death registrato nel canale con successo.`, ephemeral: true });
}