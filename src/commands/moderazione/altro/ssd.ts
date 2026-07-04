import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags, TextChannel } from 'discord.js';
import { CONFIG } from '../../../utils/config';

export const data = new SlashCommandBuilder()
    .setName('ssd')
    .setDescription('Annuncia la chiusura ufficiale della sessione (Server Shut Down) nel canale di stato.')
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // 🛡️ Sicurezza: Controllo manuale aggiuntivo dei permessi Staff
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.MuteMembers)) {
        return void await interaction.editReply({ content: '❌ Permesso negato: Questo comando è riservato esclusivamente allo Staff.' });
    }

    const RUOLO_ID = "1521635928269914303"; 
    const tagRuolo = `<@&${RUOLO_ID}>`;

    // Estrazione automatica del canale dal config
    const canaleStatus = interaction.client.channels.cache.get(CONFIG.CHANNELS.STATUS_ID) as TextChannel;
    if (!canaleStatus || typeof canaleStatus.send !== 'function') {
        return void await interaction.editReply({ content: '❌ Errore critico: Il canale `STATUS_ID` nel `config.ts` non esiste o non è valido.' });
    }

    // 🎨 LAYOUT PREMIUM CRIMSON-RED (Con i tuoi testi personalizzati)
    const embed = new EmbedBuilder()
        .setTitle('🔴 SSD • Server Shut Down')
        .setDescription(
            `🛑 **Il server ha ufficialmente chiuso momentaneamente.**\n` +
            `Concluso con successo con motivi come Mancanza di Player, Mancanza di Staff o Problemi Interni.`
        )
        .setColor('#ef4444') // Rosso Acceso Premium
        .addFields(
            { 
                name: '┃ 📉 Stato Attuale Server', 
                value: `\`\`\`diff\n- STATO: Offline\n- FUNZIONI: Accesso Vietato\n\`\`\``, 
                inline: false 
            },
            {
                name: '┃ 🚪 Protocollo da Seguire',
                value: `> 🚪 **Sloggate** immediatamente dal server di Roblox se lo staffer non ha già eseguito il __kick all__.\n> 🔄 **Attendete** la prossima votazione per il Server Start Up (SSU).\n> 💬 **Rimanete attivi** nelle chat per ricevere sempre più ricompense.`,
                inline: false
            },
            {
                name: '┃ 📝 Nota da Apex Italy RP',
                value: `*Ringraziamo chi ha partecipato all'SSU con immenso cuore, vi attendiamo al prossimo!*`,
                inline: false
            }
        )
        .setFooter({ text: 'Staff • Apex Italy RP', iconURL: interaction.guild?.iconURL() || undefined })
        .setTimestamp();

    try {
        await canaleStatus.send({ content: `${tagRuolo}`, embeds: [embed] });
        await interaction.editReply({ content: `✅ Annuncio SSD (Chiusura) trasmesso con successo nel canale ${canaleStatus}!` });
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: '❌ Si è verificato un errore critico durante l\'invio dell\'embed SSD.' });
    }
}