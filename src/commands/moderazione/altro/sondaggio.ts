import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } from 'discord.js';
import { CONFIG, checkPermission } from '../../../utils/config';

export const data = new SlashCommandBuilder()
    .setName('sondaggio')
    .setDescription('Crea un sondaggio ad interazione con calcolo in tempo reale.')
    .addStringOption(opt => opt.setName('domanda').setDescription('La domanda principale').setRequired(true))
    .addStringOption(opt => opt.setName('descrizione').setDescription('Descrizione o chiarimento').setRequired(true))
    .addStringOption(opt => opt.setName('opzione1').setDescription('Prima scelta').setRequired(true))
    .addStringOption(opt => opt.setName('opzione2').setDescription('Seconda scelta').setRequired(true))
    .addStringOption(opt => opt.setName('opzione3').setDescription('Opzione 3 facoltativa').setRequired(false))
    .addStringOption(opt => opt.setName('opzione4').setDescription('Opzione 4 facoltativa').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
    const domanda = interaction.options.getString('domanda');
    const descrizione = interaction.options.getString('descrizione');
    
    // Raccogliamo le opzioni disponibili in un array pulito
    const opzioniGrezze = [
        interaction.options.getString('opzione1'),
        interaction.options.getString('opzione2'),
        interaction.options.getString('opzione3'),
        interaction.options.getString('opzione4')
    ].filter(Boolean) as string[];

    // Inizializziamo i voti a 0 per ciascuno
    const voti: { [key: string]: number } = {};
    opzioniGrezze.forEach(op => voti[op] = 0);

    // Funzione helper interna per generare la barra di caricamento (esattamente come il design Discord dei tuoi screen)
    const generaBarra = (percentuale: number) => {
        const blocchiTotali = 10;
        const verdi = Math.round((percentuale / 100) * blocchiTotali);
        const grigi = blocchiTotali - verdi;
        return '🟩'.repeat(verdi) + '⬛'.repeat(grigi);
    };

    const buildFields = () => {
        const totali = Object.values(voti).reduce((a, b) => a + b, 0) || 1;
        return opzioniGrezze.map(op => {
            const count = voti[op];
            const pct = Math.round((count / (totali === 1 ? 1 : totali)) * 100);
            return {
                name: op.toLowerCase(),
                value: `${generaBarra(pct)} **${count} voti** (${pct}%)`,
                inline: false
            };
        });
    };

    const sondaggioEmbed = new EmbedBuilder()
        .setTitle('📊 • Sondaggio __Apex Italy RP__')
        .setColor(CONFIG.COLORS.INFO)
        .setDescription(`**${domanda}**\n*(${descrizione})*`)
        .addFields(buildFields())
        .setFooter({ text: `Totale Votanti: 0 • Apex Italy RP` })
        .setTimestamp();

    const menu = new StringSelectMenuBuilder()
        .setCustomId('seleziona_sondaggio')
        .setPlaceholder('Scegli un\'opzione dal menù per esprimere il tuo voto...');

    opzioniGrezze.forEach((op, index) => {
        menu.addOptions({ label: op, value: op, description: `Vota per: ${op}` });
    });

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
    const msg = await interaction.reply({ embeds: [sondaggioEmbed], components: [row], fetchReply: true });

    // Gestione dei voti in tempo reale (Collector di 24 ore)
    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 86400000 });
    const utentiVotanti = new Set<string>();

    collector.on('collect', async (i) => {
        if (utentiVotanti.has(i.user.id)) {
            return i.reply({ content: '❌ Hai già espresso il tuo voto in questo sondaggio!', ephemeral: true });
        }

        const scelta = i.values[0];
        voti[scelta]++;
        utentiVotanti.add(i.user.id);

        const editEmbed = new EmbedBuilder()
            .setTitle('📊 • Sondaggio __Apex Italy RP__')
            .setColor(CONFIG.COLORS.INFO)
            .setDescription(`**${domanda}**\n*(${descrizione})*`)
            .addFields(buildFields())
            .setFooter({ text: `Totale Votanti: ${utentiVotanti.size} • Apex Italy RP` })
            .setTimestamp();

        await i.update({ embeds: [editEmbed] });
    });
}