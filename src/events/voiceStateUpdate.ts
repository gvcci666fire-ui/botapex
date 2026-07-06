import { Events, VoiceState, EmbedBuilder, TextChannel, ChannelType } from 'discord.js';

// Configurazione ID principali
const ID_VOCALE_ATTESA = "1521636360379830282"; // Metti l'ID del canale "Attesa Assistenza" principale
const ID_TESTUALE_LOG = "1523365699202973736";   // Metti l'ID del canale testuale staff
const ID_PING = "1521635837970747423";                    // ID del Ruolo/Utente staff da pingare

// Lista ordinata dei canali di assistenza (Stanze 1, 2, 3, 4, 5)
const STANZE_ASSISTENZA = [
    "1521636361998700666", // Assistenza 1
    "1521636363219505305", // Assistenza 2
    "1521636364930781345", // Assistenza 3
    "1521636366457372722", // Assistenza 4
    "1521636367866794085"  // Assistenza 5
];

export const name = Events.VoiceStateUpdate;
export const once = false;

export async function execute(oldState: VoiceState, newState: VoiceState) {
    // Controlla se l'utente è entrato nel canale di attesa
    if (newState.channelId === ID_VOCALE_ATTESA && oldState.channelId !== ID_VOCALE_ATTESA) {
        
        const member = newState.member;
        if (!member || member.user.bot) return;

        const guild = newState.guild;
        const channelTestuale = guild.channels.cache.get(ID_TESTUALE_LOG) as TextChannel;
        if (!channelTestuale) return;

        // Cerca la prima stanza libera in ordine cronologico (dalla 1 alla 5)
        let stanzaLiberaId: string | null = null;

        for (const idStanza of STANZE_ASSISTENZA) {
            const canaleVocale = guild.channels.cache.get(idStanza);
            
            // Controlla se il canale esiste, è vocale ed è vuoto (0 membri all'interno)
            if (canaleVocale && canaleVocale.type === ChannelType.GuildVoice) {
                if (canaleVocale.members.size === 0) {
                    stanzaLiberaId = idStanza;
                    break; // Trovata la prima libera, interrompe il ciclo for
                }
            }
        }

        // Prepariamo il testo per l'assistenza disponibile
        const testoStanzaDisponibile = stanzaLiberaId 
            ? `<#${stanzaLiberaId}>` 
            : "❌ Nessuna stanza assistenza libera al momento!";

        // Crea l'embed modificando il vecchio campo con quello della stanza libera cliccabile
        const embedAssistenza = new EmbedBuilder()
            .setTitle('🚨 Richiesta Assistenza')
            .setDescription(`Un utente è entrato in attesa assistenza. Fornisci nel minor tempo possibile supporto!`)
            .setColor('#ff0000')
            .addFields(
                { name: '👤 Utente', value: `${member.user} (${member.user.tag})`, inline: true },
                { name: '🆔 ID Utente', value: `\`${member.id}\``, inline: true },
                { name: '👉 Stanza Libera', value: testoStanzaDisponibile, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Apex Italy RP • Assistenza' });

        try {
            await channelTestuale.send({
                content: `<@&${ID_PING}>`,
                embeds: [embedAssistenza]
            });
        } catch (error) {
            console.error("❌ Errore nell'invio della notifica di assistenza:", error);
        }
    }
}