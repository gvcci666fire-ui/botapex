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
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.MuteMembers)) {
        return void await interaction.editReply({ content: '❌ Permesso negato: Questo comando è riservato esclusivamente allo Staff.' });
    }

    const RUOLO_ID = "1521635928269914303"; 
    const tagRuolo = `<@&${RUOLO_ID}>`;
    const codiceServer = "ApexITRP";
    const linkServer = `https://erlc.gg/join/${codiceServer}`;

    const canaleStatus = interaction.client.channels.cache.get(CONFIG.CHANNELS.STATUS_ID) as TextChannel;
    const canaleLog = interaction.client.channels.cache.get(CONFIG.CHANNELS.LOGS_VOTAZIONI) as TextChannel;

    if (!canaleStatus || typeof canaleStatus.send !== 'function') {
        return void await interaction.editReply({ content: '❌ Errore critico: Il canale `STATUS_ID` nel `config.ts` non esiste.' });
    }

    // 🎨 EMBED SSU
    const embedSSU = new EmbedBuilder()
        .setTitle('🟢 SSU • Server Start Up')
        .setDescription(`⚡ **L'attesa è finita, la città riprende vita!**\nLa votazione ha avuto successo, e il server ha finalmente aperto le porte per un nuovo e fresco RP!`)
        .setColor('#10b981')
        .addFields(
            { name: '┃ 🗺️ Dettagli Server', value: `• **Nome:** Apex Italy Roleplay\n• **Codice:** \`${codiceServer}\``, inline: true },
            { name: '┃ ⚡ Stato', value: `\`\`\`diff\n+ Online\n\`\`\``, inline: true },
            { name: '┃ 🔗 Collegamento', value: `> 🎮 [**Entra in gioco**](${linkServer})\n> 💻 \`erlc.gg/join/${codiceServer}\``, inline: false },
            { name: '┃ ⚠️ Nota Staff', value: '```fix\nÈ obbligatorio rispettare il regolamento. Buon Roleplay!\n```', inline: false }
        )
        .setFooter({ text: 'Staff • Apex Italy RP', iconURL: interaction.guild?.iconURL() || undefined })
        .setTimestamp();

    const rigaComponenti = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('segnala_low_status').setLabel('Segnala Poca Attività (SLS)').setEmoji('⚠️').setStyle(ButtonStyle.Secondary)
    );

    const messaggioPubblico = await canaleStatus.send({ content: `${tagRuolo}`, embeds: [embedSSU], components: [rigaComponenti] });

    // 📝 LOG AVVIO SSU
    if (canaleLog) {
        await canaleLog.send({
            embeds: [new EmbedBuilder()
                .setTitle('🚀 Logs Staff - Status SSU')
                .setColor('#10b981')
                .setDescription(`Il server è stato avviato dallo staffer **${interaction.user.username}**`)
                .addFields({ name: '👤 Staffer', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true })
                .setTimestamp()]
        }).catch(console.error);
    }

    await interaction.editReply({ content: `✅ Annuncio SSU pubblicato!` });

    const collector = messaggioPubblico.createMessageComponentCollector({ componentType: ComponentType.Button });

    collector.on('collect', async (btnInteraction: ButtonInteraction) => {
        if (!btnInteraction.memberPermissions?.has(PermissionFlagsBits.MuteMembers)) {
            return void await btnInteraction.reply({ content: '❌ Solo lo Staff può usare questo modulo.', flags: MessageFlags.Ephemeral });
        }

        const embedSLS = new EmbedBuilder()
            .setTitle('⚠️ Apex Italy RP • Low Activity Status')
            .setDescription(`📊 **Rilevato calo di affluenza.** Il server è **ONLINE**, approfittane ora!`)
            .setColor('#f59e0b')
            .addFields(
                { name: '┃ 🏙️ Analisi', value: `\`\`\`fix\n• STATUS: BASSA PRESENZA\n\`\`\``, inline: true },
                { name: '┃ 🚀 Ingresso', value: `> 🔗 [**Entra Ora**](${linkServer})`, inline: true }
            )
            .setTimestamp();

        await canaleStatus.send({ embeds: [embedSLS] });
        await btnInteraction.reply({ content: '✅ Segnalazione SLS inoltrata!', flags: MessageFlags.Ephemeral });

        // 📝 LOG SLS
        if (canaleLog) {
            await canaleLog.send({
                embeds: [new EmbedBuilder()
                    .setTitle('⚠️ Logs Staff - Segnalazione Bassa Attività')
                    .setColor('#f59e0b')
                    .setDescription(`Uno staffer ha segnalato bassa attività all'interno del game!`)
                    .addFields({ name: '👤 Staffer', value: `${btnInteraction.user} (\`${btnInteraction.user.id}\`)`, inline: true })
                    .setTimestamp()]
            }).catch(console.error);
        }
    });
}