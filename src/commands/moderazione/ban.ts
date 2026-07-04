import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, TextChannel, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CONFIG, checkPermission } from '../../utils/config';

export const data = new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Applica un ban ad un utente sincronizzandolo con i dati Roblox.')
    .addStringOption(option => option.setName('user_roblox').setDescription('Username di Roblox').setRequired(true))
    .addUserOption(option => option.setName('user_discord').setDescription('Utente Discord da bannare').setRequired(true))
    .addStringOption(option => option.setName('motivazione').setDescription('Motivazione sintetica').setRequired(true))
    .addStringOption(option => option.setName('descrizione').setDescription('Descrizione dettagliata dell\'accaduto').setRequired(true))
    .addStringOption(option => option.setName('durata').setDescription('Durata (es. Permanente, 7 Giorni)').setRequired(true))
    .addStringOption(option => option.setName('whitelist').setDescription('Può rimettere la whitelist?').setRequired(true).addChoices(
        { name: 'Sì', value: 'Sì' },
        { name: 'No', value: 'No' }
    ));

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!checkPermission(interaction.member, 1)) {
        return interaction.reply({ content: "❌ Permessi insufficienti.", ephemeral: true });
    }

    const robloxUser = interaction.options.getString('user_roblox');
    const discordUser = interaction.options.getUser('user_discord');
    const motivazione = interaction.options.getString('motivazione');
    const descrizione = interaction.options.getString('descrizione');
    const durata = interaction.options.getString('durata');
    const whitelist = interaction.options.getString('whitelist');

    if (!robloxUser || !discordUser || !motivazione || !descrizione || !durata || !whitelist) {
        return interaction.reply({ content: '❌ Tutti i campi del ban sono obbligatori.', ephemeral: true });
    }

    try {
        const erlcResponse = await fetch('https://api.policeroleplay.community/v1/server/command', {
            method: 'POST',
            headers: {
                'Server-Key': CONFIG.ERLC_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ command: `:ban ${robloxUser}` })
        });

        if (!erlcResponse.ok) {
            console.error('Errore ERLC ban:', erlcResponse.status, await erlcResponse.text());
        }
    } catch (error) {
        console.error('Errore durante la chiamata ERLC per ban:', error);
    }

    const banEmbed = new EmbedBuilder()
        .setTitle('🛑 Ban dal Game')
        .setColor(0xFF0000)
        .setThumbnail(discordUser.displayAvatarURL({ forceStatic: false }) || null)
        .setDescription(`Autore: ${discordUser}`)
        .addFields(
            { name: 'Nome & ID Utente', value: `\`\`\`${discordUser.username} ${discordUser.id}\`\`\``, inline: false },
            { name: 'Nome Roblox', value: `\`\`\`${robloxUser}\`\`\``, inline: false },
            { name: 'Motivazione Principale', value: `\`\`\`${motivazione}\`\`\``, inline: false },
            { name: 'Descrizione Estesa', value: `\`\`\`${descrizione}\`\`\``, inline: false },
            { name: 'Whitelist', value: `\`\`\`${whitelist}\`\`\``, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: 'Se non ritieni il ban corretto, ti preghiamo di aprire ticket.', iconURL: interaction.client.user?.displayAvatarURL() || undefined });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`unban_${discordUser.id}_${robloxUser}`)
            .setLabel('Sbanna Utente')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(!checkPermission(interaction.member, 2))
    );

    const logChannel = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.LOGS_MODERAZIONE) as TextChannel;
    if (logChannel) await logChannel.send({ embeds: [banEmbed], components: [row] });

    await interaction.reply({ content: `✅ Ban registrato con successo per l'utente Roblox/Discord \`${robloxUser}\`.\nDurata Ban: ${durata}`, flags: [MessageFlags.Ephemeral] });
    await interaction.channel?.send({ embeds: [banEmbed], components: [row] });
}