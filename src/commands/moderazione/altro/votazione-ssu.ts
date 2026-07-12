import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ComponentType,
    MessageFlags,
    TextChannel,
    ButtonInteraction
} from 'discord.js';
import { CONFIG } from '../../../utils/config';
import { creaVotazioneSsu, aggiungiVotoSsu, getVotiSsu, getVotoUtenteSsu, getAllVotiSsu } from '../../../utils/votazioniDB';
import { v4 as uuidv4 } from 'uuid';

const SOGLIA = 6;

export const data = new SlashCommandBuilder()
    .setName('votazione-ssu')
    .setDescription('Inizializza la votazione d\'apertura nel canale di stato dedicato.')
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const votazioneSsuId = uuidv4();
    const RUOLO_ID = "1521635928269914303";
    const tagRuolo = `<@&${RUOLO_ID}>`;

    const note = [
        "Il divertimento è la priorità, ma il realismo è la nostra regola d'oro.",
        "Assicurati di aver letto gli ultimi aggiornamenti al regolamento prima di entrare.",
        "Il comportamento corretto è richiesto in ogni fase della simulazione.",
        "Ogni segnalazione di FailRP sarà gestita con estrema severità dallo staff.",
        "Collaborazione tra reparti: la chiave per una sessione di successo.",
        "Non dimenticare di controllare il tuo equipaggiamento prima di entrare in servizio."
    ];
    const notaCasuale = note[Math.floor(Math.random() * note.length)];

    function getFavorevoli() {
        const voti = getVotiSsu(votazioneSsuId);
        return voti.favorevoli;
    }

    function getContrari() {
        const voti = getVotiSsu(votazioneSsuId);
        return voti.contrari;
    }

    function creaRiga() {
        const favorevoli = getFavorevoli();
        const contrari = getContrari();
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`voto_favorevole_${votazioneSsuId}`)
                .setLabel(`Approva (${favorevoli.length})`)
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`voto_contrario_${votazioneSsuId}`)
                .setLabel(`Disapprova (${contrari.length})`)
                .setStyle(ButtonStyle.Danger)
        );
    }

    function creaEmbeds(): EmbedBuilder[] {
        const favorevoli = getFavorevoli();
        const contrari = getContrari();
        const pieni = Math.min(favorevoli.length, SOGLIA);
        const vuoti = SOGLIA - pieni;
        
        const barraProgresso = '🟩'.repeat(pieni) + '⬛'.repeat(vuoti);
        const elencoFavorevoli = favorevoli.length > 0 ? favorevoli.map(id => `• <@${id}>`).join('\n') : '*Nessuna presenza registrata*';
        const sogliaRaggiunta = favorevoli.length >= SOGLIA;

        const descrizioneStato = sogliaRaggiunta 
            ? `🎉 **Il quorum minimo di ${SOGLIA} utenti favorevoli è stato soddisfatto!**\n\nLe procedure di inizializzazione del server sono iniziate, attendere lo staffer.`
            : `⚖️ **Lo staff è pronto per aprire le porte!**\nMa prima di ciò abbiamo bisogno anche di voi, alla soglia di 6 voti sarà possibile l'apertura!.\nEsprimi la tua preferenza tramite i moduli interattivi sottostanti.`;

        const coloreEmbed = sogliaRaggiunta ? '#10b981' : '#2463eb';
        const titoloEmbed = sogliaRaggiunta ? '⚡ Soglia Raggiunta! • Il server è pronto!' : '📊 Votazione SSU • Apex Italy RP';

        const embedPrincipale = new EmbedBuilder()
            .setTitle(titoloEmbed)
            .setDescription(descrizioneStato)
            .setColor(coloreEmbed)
            .addFields(
                { 
                    name: '┃ 📈 Progresso Votazione', 
                    value: `\`\`\`📊 ${barraProgresso} ( ${favorevoli.length} / ${SOGLIA} Voti )\`\`\``, 
                    inline: false 
                },
                {
                    name: '┃ 🗳️ Tabella di Pro e Contro',
                    value: `> 🟩 Favorevoli: **${favorevoli.length}**\n> 🟥 Contrari: **${contrari.length}**\n> 👥 Partecipanti: **${favorevoli.length + contrari.length}**`,
                    inline: false
                },
                { 
                    name: '┃ ⚠️ Nota dallo Staff di Apex Italy RP', 
                    value: `\`\`\`fix\n${notaCasuale}\n\`\`\``, 
                    inline: false 
                }
            )
            .setFooter({ text: 'Votazione SSU • Apex Italy RP', iconURL: interaction.guild?.iconURL() || undefined })
            .setTimestamp();

        const embedListaFavorevoli = new EmbedBuilder()
            .setTitle('┃ 🟢 Utenti Favorevoli all\'Apertura')
            .setDescription(elencoFavorevoli)
            .setColor(coloreEmbed);

        return [embedPrincipale, embedListaFavorevoli];
    }

    function creaEmbedLog(userId: string, tipo: 'favorevole' | 'contrario', cambio: boolean) {
        const favorevoli = getFavorevoli();
        const contrari = getContrari();
        const tipoTesto = tipo === 'favorevole' ? '🟢 APPROVAZIONE' : '🔴 DISAPPROVAZIONE';
        const colore = tipo === 'favorevole' ? '#10b981' : '#ef4444';

        return new EmbedBuilder()
            .setTitle('⚖️ LOGS • Sistema Votazioni SSU')
            .setDescription(
                `• **Operatore:** <@${userId}> (\`${userId}\`)\n` +
                `• **Azione:** Ha espresso voto di **${tipoTesto}**\n` +
                `• **Variazione:** ${cambio ? '🔄 Sì (Ha modificato un voto precedente)' : '🆕 No (Primo inserimento)'}`
            )
            .setColor(colore)
            .addFields({
                name: '📋 Rendimento Voti Totali',
                value: `\`\`\`yaml\nFavorevoli: ${favorevoli.length}\nContrari: ${contrari.length}\nTotali: ${favorevoli.length + contrari.length}\n\`\`\``,
                inline: false
            })
            .setFooter({ text: 'Registro Logs Staff • Apex Italy RP', iconURL: interaction.guild?.iconURL() || undefined })
            .setTimestamp();
    }

    const canaleStatus = interaction.client.channels.cache.get(CONFIG.CHANNELS.STATUS_ID) as TextChannel;
    const canaleLog = interaction.client.channels.cache.get(CONFIG.CHANNELS.LOGS_VOTAZIONI) as TextChannel;

    if (!canaleStatus || typeof canaleStatus.send !== 'function') {
        return void await interaction.editReply({ content: '❌ Errore critico: Il canale `STATUS_ID` nel `config.ts` non esiste o non è valido.' });
    }

    // Invia messaggio principale
    const messaggio = await canaleStatus.send({
        content: tagRuolo,
        embeds: creaEmbeds(),
        components: [creaRiga()]
    });

    // Salva nel database
    creaVotazioneSsu(votazioneSsuId, messaggio.id, canaleStatus.id);

    // Invia Log di avvio
    if (canaleLog && typeof canaleLog.send === 'function') {
        const embedLogAvvio = new EmbedBuilder()
            .setTitle('🚀 Logs Staff - Avvio Votazione SSU')
            .setDescription(`La votazione SSU è stata avviata correttamente nel canale <#${canaleStatus.id}>.`)
            .setColor('#f1c40f')
            .addFields(
                { name: '👤 Staffer', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
                { name: '🔗 Canale', value: `${canaleStatus}`, inline: true }
            )
            .setTimestamp();
        await canaleLog.send({ embeds: [embedLogAvvio] }).catch(console.error);
    }

    await interaction.editReply({ content: `✅ Votazione avviata con successo nel canale ${canaleStatus}!` });

    const collector = messaggio.createMessageComponentCollector({
        componentType: ComponentType.Button
    });

    collector.on('collect', async (btnInteraction: ButtonInteraction) => {
        const userId = btnInteraction.user.id;
        const customIdParts = btnInteraction.customId.split('_');
        const votoType = customIdParts[2] === 'favorevole' ? 'favorevole' : 'contrario';
        
        const vecchioVoto = getVotoUtenteSsu(votazioneSsuId, userId);

        if (vecchioVoto === votoType) {
            return void await btnInteraction.reply({
                content: `❌ Hai già espresso un voto ${votoType === 'favorevole' ? 'favorevole' : 'contrario'}.`,
                flags: MessageFlags.Ephemeral
            });
        }

        const cambio = vecchioVoto !== null && vecchioVoto !== votoType;
        aggiungiVotoSsu(votazioneSsuId, userId, votoType);

        await btnInteraction.update({
            embeds: creaEmbeds(),
            components: [creaRiga()]
        });

        if (canaleLog && typeof canaleLog.send === 'function') {
            try {
                await canaleLog.send({ embeds: [creaEmbedLog(userId, votoType, cambio)] });
            } catch (e) {
                console.error('Errore durante la scrittura del Log Votazione:', e);
            }
        }
    });
}

