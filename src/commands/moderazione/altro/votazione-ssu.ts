import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    MessageFlags,
    TextChannel
} from 'discord.js';
import { CONFIG } from '../../../utils/config';
import { resetVotiSSU } from '../../../events/interactionCreate'; // Assicurati che il percorso sia corretto

let ultimoMessaggioVotazione: any = null;

const SOGLIA = 6;

export const data = new SlashCommandBuilder()
    .setName('votazione-ssu')
    .setDescription('Inizializza la votazione d\'apertura.')
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // 1. Resetta la mappa globale e disabilita i vecchi bottoni
    resetVotiSSU();
    if (ultimoMessaggioVotazione) {
        await ultimoMessaggioVotazione.edit({ components: [] }).catch(() => {});
    }

    const RUOLO_ID = "1521635928269914303";
    const canaleStatus = interaction.client.channels.cache.get(CONFIG.CHANNELS.STATUS_ID) as TextChannel;
    
    if (!canaleStatus) {
        return void await interaction.editReply({ content: '❌ Canale Status non trovato.' });
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('voto_favorevole').setLabel('Approva (0)').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('voto_contrario').setLabel('Disapprova (0)').setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
        .setTitle('📊 Votazione SSU • Apex Italy RP')
        .setDescription('⚖️ **Lo staff è pronto!** Alla soglia di 6 voti sarà possibile l\'apertura.')
        .setColor('#2463eb')
        .setTimestamp();

    ultimoMessaggioVotazione = await canaleStatus.send({
        content: `<@&${RUOLO_ID}>`,
        embeds: [embed],
        components: [row]
    });

    await interaction.editReply({ content: `✅ Votazione avviata in ${canaleStatus}!` });
}