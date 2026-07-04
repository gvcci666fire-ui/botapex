import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits, 
    MessageFlags, 
    TextChannel,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    ButtonInteraction
} from 'discord.js';
import { CONFIG } from '../../../utils/config';

export const data = new SlashCommandBuilder()
    .setName('ssu')
    .setDescription('Annuncia l\'apertura ufficiale della sessione (Server Start Up) nel canale di stato.')
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers); // Blocco nativo Discord

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // 🛡️ Sicurezza: Controllo manuale aggiuntivo dei permessi Staff
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.MuteMembers)) {
        return void await interaction.editReply({ content: '❌ Permesso negato: Questo comando è riservato esclusivamente allo Staff.' });
    }

    const RUOLO_ID = "1521635928269914303"; 
    const tagRuolo = `<@&${RUOLO_ID}>`;
    const codiceServer = "ufMYK";
    const linkServer = `https://erlc.gg/join/${codiceServer}`;

    const canaleStatus = interaction.client.channels.cache.get(CONFIG.CHANNELS.STATUS_ID) as TextChannel;
    if (!canaleStatus || typeof canaleStatus.send !== 'function') {
        return void await interaction.editReply({ content: '❌ Errore critico: Il canale `STATUS_ID` nel `config.ts` non esiste o non è valido.' });
    }

    // 🎨 EMBED SSU COORDINATO
    const embedSSU = new EmbedBuilder()
        .setTitle('🟢 SSU • Server Start Up')
        .setDescription(
            `⚡ **L'attesa è finita, la città riprende vita!**\n` +
            `La votazione ha avuto successo, e il server ha finalmente aperto le porte per un nuovo e fresco RP!`
        )
        .setColor('#10b981')
        .addFields(
            { 
                name: '┃ 🗺️ Dettagli Server', 
                value: `• **Nome:** Apex Italy Roleplay\n• **Codice d'accesso:** \`${codiceServer}\``, 
                inline: true
            },
            { 
                name: '┃ ⚡ Stato Attuale Server', 
                value: `\`\`\`diff\n+ Online\n\`\`\``, 
                inline: true
            },
            { 
                name: '┃ 🔗 Link di Collegamento Rapido', 
                value: `> 🎮 [**Clicca qui per entrare in gioco velocemente**](${linkServer})\n> 💻 Collegamento manuale: \`erlc.gg/join/${codiceServer}\``, 
                inline: false
            },
            {
                name: '┃ ⚠️ Nota dallo Staff di Apex Italy RP',
                value: '```fix\nÈ obbligatorio rispettare il regolamento interno in ogni sua parte. Buon Roleplay!\n```',
                inline: false
            }
        )
        .setFooter({ text: 'Staff • Apex Italy RP', iconURL: interaction.guild?.iconURL() || undefined })
        .setTimestamp();

    // 🔘 COSTRUZIONE BOTTONE LOW STATUS
    const rigaComponenti = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('segnala_low_status')
            .setLabel('Segnala Poca Attività (SLS)')
            .setEmoji('⚠️')
            .setStyle(ButtonStyle.Secondary)
    );

    // Invio del messaggio pubblico con il bottone allegato
    const messaggioPubblico = await canaleStatus.send({ 
        content: `${tagRuolo}`, 
        embeds: [embedSSU], 
        components: [rigaComponenti] 
    });

    await interaction.editReply({ content: `✅ Annuncio SSU pubblicato nel canale ${canaleStatus}. Il bottone di controllo è ora attivo!` });

    // ⚙️ RACCOGLITORE INTERAZIONI DEL BOTTONE (Senza scadenze di tempo)
    const collector = messaggioPubblico.createMessageComponentCollector({
        componentType: ComponentType.Button
    });

    collector.on('collect', async (btnInteraction: ButtonInteraction) => {
        // 🔒 Verifica se chi clicca il bottone ha i permessi da staffer
        const utenteIsStaff = btnInteraction.memberPermissions?.has(PermissionFlagsBits.MuteMembers);
        if (!utenteIsStaff) {
            return void await btnInteraction.reply({ 
                content: '❌ Azione fallita: Solo i membri dello Staff di Apex Italy RP possono attivare questo modulo.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        // 🎨 LAYOUT PREMIUM 3X: SERVER LOW STATUS (SLS)
        const embedSLS = new EmbedBuilder()
            .setTitle('⚠️ Apex Italy RP • Low Activity Status')
            .setDescription(
                `📊 **Rilevato un calo momentaneo dell'affluenza nel server.**\n` +
                `Ricordiamo che il server è **regolarmente ONLINE**, ma la presenza di utenti è ridotta. ` +
                `È il momento perfetto per entrare senza code, eseguire scene criminali senza farsi sgamare e molto altro!`
            )
            .setColor('#f59e0b') // Giallo Ambra Premium
            .addFields(
                { 
                    name: '┃ 🏙️ Analisi Attività', 
                    value: `\`\`\`fix\n• INFRASTRUTTURA: REGOLARE\n• AFFLUENZA: BASSA PRESENZA\n\`\`\``, 
                    inline: true 
                },
                { 
                    name: '┃ 🚀 Ingresso Immediato', 
                    value: `> 🗺️ Codice: \`${codiceServer}\`\n> 🔗 [**Entra Ora in Sessione**](${linkServer})`, 
                    inline: true 
                }
            )
            .setFooter({ text: 'Rilevamento Flussi • Apex Italy RP', iconURL: btnInteraction.guild?.iconURL() || undefined })
            .setTimestamp();

        try {
            // Invia un NUOVO messaggio lasciando intatto quello vecchio
            await canaleStatus.send({ embeds: [embedSLS] });
            await btnInteraction.reply({ content: '✅ Segnalazione di Low Status della sessione (SLS) inoltrata con successo!', flags: MessageFlags.Ephemeral });
        } catch (err) {
            console.error(err);
            await btnInteraction.reply({ content: '❌ Impossibile trasmettere il Low Status.', flags: MessageFlags.Ephemeral });
        }
    });
}