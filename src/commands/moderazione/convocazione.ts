import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits, MessageFlags, TextChannel } from 'discord.js';
import { CONFIG } from '../../utils/config';

export default {
    data: new SlashCommandBuilder()
        .setName('convocazione')
        .setDescription('Invia una convocazione ufficiale')
        .addStringOption(option => option.setName('motivo').setDescription('Il motivo della convocazione').setRequired(true))
        .addUserOption(option => option.setName('utente').setDescription('Utente da convocare').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        // 1. PRENDIAMO I DATI
        const utente = interaction.options.getUser('utente', true);
        const motivo = interaction.options.getString('motivo', true);

        // 2. CREIAMO L'EMBED
        const embed = new EmbedBuilder()
            .setTitle('📢 CONVOCAZIONE UFFICIALE')
            .setColor('#FF0000') // Rosso per dare importanza
            .setDescription(`Sei stato convocato in un canale vocale dallo staff.`)
            .addFields(
                { name: '👤 Utente', value: `${utente}`, inline: true },
                { name: '📋 Motivo', value: motivo, inline: false },
                { name: '⚠️ Nota', value: 'Presentati il prima possibile per evitare sanzioni.', inline: false }
            )
            .setTimestamp();

        // 3. RISPOSTA (Niente DEFER qui, rispondiamo subito con il messaggio)
        try {
            await interaction.reply({ 
                content: `✅ Convocazione inviata a ${utente.username}`, 
                flags: [MessageFlags.Ephemeral] 
            });

            // Inviamo anche il messaggio nel canale se serve
            await interaction.channel?.send({ content: `${utente}`, embeds: [embed] });
            const assistenzaChannel = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.ASSISTENZA_NOTIFY) as TextChannel | undefined;
            if (assistenzaChannel?.isTextBased()) {
                await assistenzaChannel.send({ content: `${utente}`, embeds: [embed] });
            }
            try {
                await utente.send({ content: `📢 Ti è stata inviata una convocazione ufficiale.`, embeds: [embed] });
            } catch {
                // ignore DM errors
            }
        } catch (error) {
            console.error("Errore nel comando convocazione:", error);
        }
    }
};