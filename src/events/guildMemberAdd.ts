import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, Events, GuildMember, TextChannel } from 'discord.js';
import { CONFIG } from '../utils/config';

const ENTRY_ROLE_ID = '1521635926399520890';
const VERIFIED_ROLE_IDS = [
    '1521635925711392948',
    '1521635922620317816',
    '1521635919143239903',
    '1521635927670132847'
];
const VERIFICATION_CHANNEL_ID = '1521636167408156895';

export const name = Events.GuildMemberAdd;
export const once = false;

export async function execute(member: GuildMember) {
    if (member.user.bot) return;

    const { guild } = member;

    const welcomeChannel = guild.systemChannel ?? guild.channels.cache.find((channel): channel is TextChannel => {
        return channel.isTextBased() && (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement);
    });

    if (!welcomeChannel) {
        console.warn(`⚠️ Nessun canale di benvenuto trovato per il server ${guild.name}.`);
    }

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

    const verificationChannel = guild.channels.cache.get(VERIFICATION_CHANNEL_ID) as TextChannel | undefined;
    if (verificationChannel) {
        const verifyRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`verify_member_${member.id}`)
                .setLabel('Completa la verifica')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅')
        );

        const verifyEmbed = new EmbedBuilder()
            .setTitle('🛡️ Verifica richiesta')
            .setDescription(`L'utente ${member} deve completare la verifica per poter accedere pienamente al server.`)
            .addFields(
                { name: '📍 Procedura', value: 'Clicca il pulsante qui sotto per ricevere il captcha e completare la verifica.', inline: false },
                { name: '⚠️ Importante', value: 'Questa verifica va eseguita prima di tutto nella procedura di accesso.', inline: false }
            )
            .setColor(CONFIG.COLORS.INFO)
            .setTimestamp();

        try {
            await verificationChannel.send({ content: `${member}`, embeds: [verifyEmbed], components: [verifyRow] });
            console.log(`✅ Messaggio di verifica inviato a ${verificationChannel.name} per ${member.user.tag}.`);
        } catch (error) {
            console.error('❌ Errore nell\'invio del messaggio di verifica:', error);
        }
    }
}
