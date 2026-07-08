import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    ButtonInteraction,
    TextChannel
} from 'discord.js';

// ID del Ruolo Staff per Torino RP
const RUOLO_STAFF = "1515305045032435804";

// Interfaccia per la struttura dei dati salvati in memoria locale
interface LocalGiveaway {
    id: number;
    creator_id: string;
    premio: string;
    descrizione: string;
    durata_minuti: number;
    inizio: number;
    fine: number;
    ruoli_richiesti: string | null;
    partecipanti: string[];
    stato: 'attivo' | 'concluso';
    messaggio_id: string;
    canale_id: string;
    vincitore_id: string | null;
}

// Database virtuale in locale (Array temporaneo in memoria)
const giveawaysDB: LocalGiveaway[] = [];
let nextGiveawayId = 1;

export const data = new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Crea un giveaway.')
    .addStringOption(o => o.setName('premio').setDescription('Cosa si mette in palio').setRequired(true))
    .addStringOption(o => o.setName('descrizione').setDescription('Descrizione del premio').setRequired(true))
    .addIntegerOption(o => o.setName('minuti').setDescription('Durata in minuti').setRequired(true).setMinValue(1))
    .addStringOption(o => o.setName('ruoli').setDescription('Ruoli richiesti (optional, separati da spazi)').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const membro = interaction.member as any;
    if (!membro.roles.cache.has(RUOLO_STAFF)) {
        await interaction.editReply({ content: '❌ Non hai i permessi per usare questo comando.' });
        return;
    }

    const premio = interaction.options.getString('premio')!;
    const descrizione = interaction.options.getString('descrizione')!;
    const minuti = interaction.options.getInteger('minuti')!;
    const ruoliTesto = interaction.options.getString('ruoli');

    const inizio = Date.now();
    const fine = inizio + (minuti * 60 * 1000);

    const embed = new EmbedBuilder()
        .setTitle(' 🎁 NUOVO GIVEAWAY APEX 🎁')
        .setDescription(`**${premio}**\n\n${descrizione}`)
        .setColor(0xf1c40f)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
            { name: '🍾 Premio', value: `\`${premio}\``, inline: true },
            { name: '📊 Stato', value: '<a:verde:1518306880005607434> `ATTIVO`', inline: true },
            { name: '\u200b', value: '\u200b', inline: true },
            { name: '🗓️ Termina', value: `<t:${Math.floor(fine / 1000)}:T>`, inline: false },
            { name: '🗞️ Descrizione', value: descrizione, inline: false }
        );

    if (ruoliTesto) {
        embed.addFields({ name: '❕Requisiti', value: ruoliTesto, inline: false });
    }

    embed.setFooter({ text: 'Sistema Giveaway • Apex Italy RP', iconURL: interaction.guild?.iconURL() || undefined })
        .setTimestamp();

    const partecipanti = new Set<string>();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('giveaway_partecipa')
            .setLabel('✅ Partecipa')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('giveaway_mostra')
            .setLabel('👥 Partecipanti')
            .setStyle(ButtonStyle.Secondary)
    );

    const messaggio = await (interaction.channel as TextChannel).send({ embeds: [embed], components: [row] });

    // Salvataggio iniziale nel database locale in memoria anziché Postgres
    const nuovoGiveaway: LocalGiveaway = {
        id: nextGiveawayId++,
        creator_id: interaction.user.id,
        premio,
        descrizione,
        durata_minuti: minuti,
        inizio,
        fine,
        ruoli_richiesti: ruoliTesto || null,
        partecipanti: [],
        stato: 'attivo',
        messaggio_id: messaggio.id,
        canale_id: interaction.channelId,
        vincitore_id: null
    };
    giveawaysDB.push(nuovoGiveaway);

    const collector = messaggio.createMessageComponentCollector({ 
        componentType: ComponentType.Button,
        time: minuti * 60 * 1000
    });

    collector.on('collect', async (btn: ButtonInteraction) => {
        if (btn.customId === 'giveaway_partecipa') {
            if (ruoliTesto) {
                const ruoliRichiesti = ruoliTesto.split(' ');
                const membroBtn = btn.guild?.members.cache.get(btn.user.id) as any;
                const haRequisitiRuoli = ruoliRichiesti.some(r => membroBtn?.roles.cache.has(r));

                if (!haRequisitiRuoli) {
                    await btn.reply({ content: '❌ Non hai i ruoli richiesti per partecipare.', flags: MessageFlags.Ephemeral });
                    return;
                }
            }

            if (partecipanti.has(btn.user.id)) {
                await btn.reply({ content: '❌ Sei già iscritto!', flags: MessageFlags.Ephemeral });
                return;
            }

            partecipanti.add(btn.user.id);
            
            // Aggiorna la lista dei partecipanti nell'oggetto locale in memoria
            const gwLocal = giveawaysDB.find(g => g.messaggio_id === messaggio.id);
            if (gwLocal) gwLocal.partecipanti = [...partecipanti];

            await btn.reply({ content: `✅ Iscritto! Hai **${partecipanti.size}** altri partecipanti al giveaway.`, flags: MessageFlags.Ephemeral });

        } else if (btn.customId === 'giveaway_mostra') {
            const listaPartecipanti = [...partecipanti].map(id => `<@${id}>`).join('\n') || '*Nessun partecipante ancora*';
            
            const embedPartecipanti = new EmbedBuilder()
                .setTitle('🌐 Partecipanti Giveaway')
                .setDescription(listaPartecipanti)
                .setColor(0x3498db)
                .setFooter({ text: `Totale: ${partecipanti.size} partecipanti` })
                .setTimestamp();

            await btn.reply({ embeds: [embedPartecipanti], flags: MessageFlags.Ephemeral });
        }
    });

    collector.on('end', async () => {
        const gwLocal = giveawaysDB.find(g => g.messaggio_id === messaggio.id);

        if (partecipanti.size === 0) {
            const embedFinale = new EmbedBuilder()
                .setTitle('🕓 Giveaway Terminato')
                .setDescription(`Nessun partecipante. Il giveaway di **${premio}** è stato annullato.`)
                .setColor(0xe74c3c)
                .setFooter({ text: 'Sistema Giveaway • Apex Italy RP' })
                .setTimestamp();

            await messaggio.edit({ embeds: [embedFinale], components: [] });
            
            // Aggiorna lo stato in locale
            if (gwLocal) gwLocal.stato = 'concluso';
            return;
        }

        const participantiArray = [...partecipanti];
        const vincitore = participantiArray[Math.floor(Math.random() * participantiArray.length)];

        const embedFinale = new EmbedBuilder()
            .setTitle('🕓 Giveaway Terminato!')
            .setDescription(`**🎁 Vincitore: <@${vincitore}>**\n\nHa vinto: **${premio}**`)
            .setColor(0x08803a)
            .addFields(
                { name: '🌐 Totale Partecipanti', value: `${partecipanti.size}`, inline: true },
                { name: '📝 Premio', value: `\`${premio}\``, inline: true }
            )
            .setFooter({ text: 'Sistema Giveaway • Apex Italy RP' })
            .setTimestamp();

        await messaggio.edit({ embeds: [embedFinale], components: [] });
        
        // Aggiorna lo stato e il vincitore in locale
        if (gwLocal) {
            gwLocal.stato = 'concluso';
            gwLocal.vincitore_id = vincitore;
        }

        try {
            const vincitoreUser = await interaction.client.users.fetch(vincitore);
            const embedDM = new EmbedBuilder()
                .setTitle('🍾 Hai Vinto!')
                .setDescription(`🎁 Complimenti! Hai vinto il giveaway e ricevi: **${premio}**\n\nContatta lo staff per ritirare il premio.`)
                .setColor(0x08803a)
                .setFooter({ text: 'Sistema Giveaway • Apex Italy RP' })
                .setTimestamp();

            await vincitoreUser.send({ embeds: [embedDM] });
        } catch (e) {
            console.error('Impossibile inviare DM al vincitore:', e);
        }
    });

    await interaction.editReply({ content: 'Giveaway creato con successo!' });
}