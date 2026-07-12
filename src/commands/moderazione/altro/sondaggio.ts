import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } from 'discord.js';
import { CONFIG } from '../../../utils/config';
import { creasondaggio, getVotiSondaggio, getUtentiVotantiSondaggio, getVotoUtenteSondaggio, aggiungiVoto } from '../../../utils/votazioniDB';
import { v4 as uuidv4 } from 'uuid';

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
    const domanda = interaction.options.getString('domanda')!;
    const descrizione = interaction.options.getString('descrizione')!;

    const opzioniGrezze = [
        interaction.options.getString('opzione1'),
        interaction.options.getString('opzione2'),
        interaction.options.getString('opzione3'),
        interaction.options.getString('opzione4')
    ].filter(Boolean) as string[];

    const votazioneId = uuidv4();

    // Funzione helper per generare la barra
    const generaBarra = (percentuale: number) => {
        const blocchiTotali = 10;
        const verdi = Math.round((percentuale / 100) * blocchiTotali);
        const grigi = blocchiTotali - verdi;
        return '🟩'.repeat(verdi) + '⬛'.repeat(grigi);
    };

    const buildFields = () => {
        const voti = getVotiSondaggio(votazioneId);
        const totali = Object.values(voti).reduce((a, b) => a + b, 0) || 1;

        return opzioniGrezze.map(op => {
            const count = voti[op] || 0;
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
        .setCustomId(`seleziona_sondaggio_${votazioneId}`)
        .setPlaceholder('Scegli un\'opzione dal menù per esprimere il tuo voto...');

    opzioniGrezze.forEach((op) => {
        menu.addOptions({ label: op, value: op, description: `Vota per: ${op}` });
    });

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
    const msg = await interaction.reply({ embeds: [sondaggioEmbed], components: [row], fetchReply: true });

    // Salva nel database
    creasondaggio(votazioneId, msg.id, interaction.channelId, domanda, opzioniGrezze);

    // Collector
    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 86400000 });

    collector.on('collect', async (i) => {
        const votoEsistente = getVotoUtenteSondaggio(votazioneId, i.user.id);

        if (votoEsistente) {
            return i.reply({ content: '❌ Hai già espresso il tuo voto in questo sondaggio!', ephemeral: true });
        }

        const scelta = i.values[0];
        aggiungiVoto(votazioneId, i.user.id, scelta);

        const utentiVotanti = getUtentiVotantiSondaggio(votazioneId);

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

