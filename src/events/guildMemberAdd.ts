import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events, GuildMember, TextChannel } from 'discord.js';
import { CONFIG } from '../utils/config';

const ENTRY_ROLE_ID = '1521635926399520890'; // Ruolo iniziale per i nuovi membri
const VERIFICATION_CHANNEL_ID = '1521636167408156895';

export const name = Events.GuildMemberAdd;
export const once = false;

export async function execute(member: GuildMember) {
    if (member.user.bot) return;

    const { guild } = member;

    // 1. Canale di Benvenuto Principale
    const welcomeChannel = guild.channels.cache.get("1521636166154326098") as TextChannel | undefined;

    if (!welcomeChannel) {
        console.warn(`⚠️ Nessun canale di benvenuto trovato per il server ${guild.name}.`);
    }

    // 2. Assegnazione Ruolo Iniziale
    try {
        const entryRole = guild.roles.cache.get(ENTRY_ROLE_ID) ?? await guild.roles.fetch(ENTRY_ROLE_ID).catch(() => null);
        if (entryRole) {
            await member.roles.add(entryRole);
            console.log(`✅ Ruolo iniziale assegnato a ${member.user.tag}.`);
        }
    } catch (error) {
        console.warn(`⚠️ Impossibile assegnare il ruolo iniziale a ${member.user.tag}:`, error);
    }

    const joinedAt = member.joinedAt ? new Date(member.joinedAt).toLocaleString('it-IT') : 'recentemente';

    // 3. Invio Embed Benvenuto
    const welcomeEmbed = new EmbedBuilder()
        .setTitle('🎉 Benvenuto su Apex Italy RP!')
        .setDescription(
            `Ciao ${member}, benvenuto nel server!\n\n` +
            `Prima di tutto, leggi le regole in <#1516057528587522169> e inzia parla con noi in <#1521636204213178468>.\n\n` +
            `Dopo di che, puoi richiedere la cittadinanza in <#1521636216511135968> e la patente in <#1521636219736293576>.\n\n` +
            `⚠️ La verifica va completata prima di tutto in <#1521636167408156895>.`
        )
        .setColor(CONFIG.COLORS.TORINO_RED)
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .addFields(
            { name: '📌 Cosa fare adesso', value: 'Leggi i canali informativi, presentati in modo corretto e segui le regole del server.', inline: false },
            { name: '🛡️ Regole importanti', value: 'Rispettare gli altri utenti, evitare comportamenti scorretti e leggere attentamente il regolamento ufficiale.', inline: false },
            { name: '🕒 Entrato il', value: joinedAt, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `Apex Italy RP • Benvenuto • ${guild.name}` });

    if (welcomeChannel) {
        try {
            await welcomeChannel.send({ content: `Benvenuto ${member}!`, embeds: [welcomeEmbed] });
            console.log(`✅ Messaggio di benvenuto inviato a ${welcomeChannel.name} per ${member.user.tag}.`);
        } catch (error) {
            console.error('❌ Errore nell\'invio del messaggio di benvenuto:', error);
        }
    }

    // 4. Invio Messaggio nel Canale di Verifica
    const verificationChannel = guild.channels.cache.get(VERIFICATION_CHANNEL_ID) as TextChannel | undefined;
    
    if (verificationChannel) {
        // Creiamo il bottone pubblico che l'utente dovrà cliccare
        const verifyRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`verify_member_${member.id}`)
                .setLabel('Inizia Verifica')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅')
        );

        const verifyEmbed = new EmbedBuilder()
            .setTitle('🛡️ Verifica richiesta')
            .setDescription(`Benvenuto ${member}! Per sbloccare i canali del server devi superare la verifica di sicurezza.`)
            .addFields(
                { name: '📍 Procedura', value: 'Clicca il pulsante qui sotto per iniziare la procedura guidata.', inline: false },
                { name: '⚠️ Importante', value: 'Questa verifica è obbligatoria per prevenire bot e account fake.', inline: false }
            )
            .setColor(CONFIG.COLORS.INFO)
            .setTimestamp()
            .setFooter({ text: 'Apex Italy RP • Sistema di Verifica' });
            ephemeral: true;

        try {
            await verificationChannel.send({ content: `${member}`, embeds: [verifyEmbed], components: [verifyRow] });
            console.log(`✅ Messaggio di verifica inviato a ${verificationChannel.name} per ${member.user.tag}.`);
        } catch (error) {
            console.error('❌ Errore nell\'invio del messaggio di verifica:', error);
        }
    }
}