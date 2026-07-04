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

const SOGLIA = 6;

export const data = new SlashCommandBuilder()
    .setName('votazione-ssu')
    .setDescription('Inizializza la votazione d\'apertura nel canale di stato dedicato.')
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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
    const voti = new Map<string, 'favorevole' | 'contrario'>();

    function getFavorevoli() {
        return [...voti.entries()].filter(([_, v]) => v === 'favorevole').map(([id]) => id);
    }
    function getContrari() {
        return [...voti.entries()].filter(([_, v]) => v === 'contrario').map(([id]) => id);
    }

    function creaRiga() {
        const favorevoli = getFavorevoli();
        const contrari = getContrari();
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('voto_favorevole')
                .setLabel(`Approva (${favorevoli.length})`)
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('voto_contrario')
                .setLabel(`Disapprova (${contrari.length})`)
                .setStyle(ButtonStyle.Danger)
        );
    }

    // 🎨 GENERATORE DI EMBED APEX ITALY RP (MIGLIORATO 100x)
    function creaEmbed() {
        const favorevoli = getFavorevoli();
        const contrari = getContrari();
        const pieni = Math.min(favorevoli.length, SOGLIA);
        const vuoti = SOGLIA - pieni;
        
        // Barra di caricamento premium bicolore minimalista
        const barraProgresso = '🟩'.repeat(pieni) + '⬛'.repeat(vuoti);
        const elencoFavorevoli = favorevoli.length > 0 ? favorevoli.map(id => `• <@${id}>`).join('\n') : '*Nessuna presenza registrata*';
        const sogliaRaggiunta = favorevoli.length >= SOGLIA;

        // 💎 LAYOUT 1: VOTAZIONE IN CORSO (Design Tecnico Blu Notte)
        if (!sogliaRaggiunta) {
            return new EmbedBuilder()
                .setTitle('📊 Votazione SSU • Apex Italy RP')
                .setDescription(
                    `⚖️ **Lo staff è pronto per aprire le porte!**\n` +
                    `Ma prima di ciò abbiamo bisogno anche di voi, alla soglia di 6 voti sarà possibile l'apertura!. ` +
                    `Esprimi la tua preferenza tramite i moduli interattivi sottostanti.`
                )
                .setColor('#2463eb') // Blu Premium
                .addFields(
                    { 
                        name: '┃ 📈 Progresso Votazione', 
                        value: `\`\`\`📊 ${barraProgresso} [ ${favorevoli.length} / ${SOGLIA} Voti ]\`\`\``, 
                        inline: false 
                    },
                    {
                        name: '┃ 🟢 Favorevoli all\'Apertura',
                        value: `${elencoFavorevoli}\n⠀`,
                        inline: false
                    },
                    {
                        name: '┃ 🗳️ Tabella di Pro e Contro',
                        value: `> 🟩 Favorevoli: **${favorevoli.length}**\n> 🟥 Contrari: **${contrari.length}**\n> 👥 Partecipanti: **${voti.size}**`,
                        inline: false
                    },
                    { 
                        name: '┃ ⚠️ Nota dallo Staff di Apex Italy RP', 
                        value: `\`\`\`fix\n${notaCasuale}\n\`\`\``, 
                        inline: true 
                    }
                )
                .setFooter({ text: 'Votazione SSU • Apex Italy RP', iconURL: interaction.guild?.iconURL() || undefined })
                .setTimestamp();
        }

        // 💎 LAYOUT 2: SOGLIA RAGGIUNTA (Design di Successo Cyber-Green)
        return new EmbedBuilder()
            .setTitle('⚡ Soglia Raggiunta! • Il server è pronto per l\'apertura!')
            .setDescription(
                `🎉 **Il quorum minimo di ${SOGLIA} utenti favorevoli è stato soddisfatto!**\n\n` +
                `Le procedure di inizializzazione del server sono inziate, attendere lo staffer. ` 
            )
            .setColor('#10b981') // Verde Smeraldo brillante
            .addFields(
                { 
                    name: '┃ 📊 Stato Soglia', 
                    value: `\`\`\`diff\n+ COMPLETATO [ ${favorevoli.length} / ${SOGLIA} ]\n\`\`\``, 
                    inline: true 
                },
                { 
                    name: '┃ 🚀 Fase Successiva', 
                    value: `> Rimanere sintonizzati su questo canale.\n> A breve verrà inviato il codice dallo Staff.`, 
                    inline: true 
                }
            )
            .setFooter({ text: 'Votazione SSU • Apex Italy RP', iconURL: interaction.guild?.iconURL() || undefined })
            .setTimestamp();
    }

    // 💎 LAYOUT 3: REGISTRO DI CONTROLLO (Design Archivio compatto per i Log Staff)
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
            .addFields(
                {
                    name: '📋 Rendimento Voti Totali',
                    value: `\`\`\`md\n* Favorevoli: [ ${favorevoli.length} ]\n* Contrari:   [ ${contrari.length} ]\n* Totali:     [ ${voti.size} ]\n\`\`\``,
                    inline: false
                }
            )
            .setFooter({ text: 'Registro Logs Staff • Apex Italy RP', iconURL: interaction.guild?.iconURL() || undefined })
            .setTimestamp();
    }

    // 🛑 Estrazione e validazione canali dal file config.ts
    const canaleStatus = interaction.client.channels.cache.get(CONFIG.CHANNELS.STATUS_ID) as TextChannel;
    const canaleLog = interaction.client.channels.cache.get(CONFIG.CHANNELS.LOGS_VOTAZIONI) as TextChannel;

    if (!canaleStatus || typeof canaleStatus.send !== 'function') {
        return void await interaction.editReply({ content: '❌ Errore critico: Il canale `STATUS_ID` nel `config.ts` non esiste o non è valido.' });
    }

    // Spedisce la votazione nel canale centralizzato preso dal config
    const messaggio = await canaleStatus.send({
        content: tagRuolo,
        embeds: [creaEmbed()],
        components: [creaRiga()]
    });

    await interaction.editReply({ content: `✅ Votazione avviata con successo nel canale ${canaleStatus}!` });

    const collector = messaggio.createMessageComponentCollector({
        componentType: ComponentType.Button
    });

    collector.on('collect', async (btnInteraction: ButtonInteraction) => {
        const userId = btnInteraction.user.id;
        const vecchioVoto = voti.get(userId);
        const nuovoVoto = btnInteraction.customId === 'voto_favorevole' ? 'favorevole' : 'contrario';
        const cambio = vecchioVoto !== undefined && vecchioVoto !== nuovoVoto;

        voti.set(userId, nuovoVoto);

        // Aggiorna l'embed pubblico
        await btnInteraction.update({
            embeds: [creaEmbed()],
            components: [creaRiga()]
        });

        // Invia in modo sicuro il log amministrativo nel canale configurato
        if (canaleLog && typeof canaleLog.send === 'function') {
            try {
                await canaleLog.send({ embeds: [creaEmbedLog(userId, nuovoVoto, cambio)] });
            } catch (e) {
                console.error('Errore durante la scrittura del Log Votazione:', e);
            }
        }
    });
}