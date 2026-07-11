import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client } from 'discord.js';
import { CONFIG } from '../../../utils/config';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('strike')
        .setDescription('Assegna un richiamo ufficiale (Strike) a uno staffer')
        .addUserOption(opt => opt.setName('utente').setDescription('Lo staffer da richiamare').setRequired(true))
        .addStringOption(opt => opt.setName('conteggio').setDescription('Situazione Strike (es. 1/3, 2/3, 3/3)').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Causa dettagliata del richiamo').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const utente = interaction.options.getUser('utente');
        const conteggio = interaction.options.getString('conteggio');
        const motivo = interaction.options.getString('motivo');

        // Validazione conteggio
        const validiConteggi = ['1/3', '2/3', '3/3'];
        if (!validiConteggi.includes(conteggio)) {
            await interaction.reply({ 
                content: '❌ Conteggio non valido. Usa: 1/3, 2/3, o 3/3', 
                ephemeral: true 
            });
            return;
        }

        const isUltimo = conteggio === '3/3';
        const colore = isUltimo ? '#c0392b' : '#e74c3c';
        const avvertimento = isUltimo ? '🚨 **ULTIMO STRIKE - A TRE COLPI LICENZIAMENTO**' : '⚠️ Richiamo Disciplinare Ufficiale';

        // ⚠️ CANALE PUBBLICO - Comunicazione disciplinare
        const embedPublic = new EmbedBuilder()
            .setTitle(`⚠️ SANZIONE STAFF • STRIKE DISCIPLINARE`)
            .setDescription(
                `**Comunicazione Ufficiale della Direzione**\n\n` +
                `Gli alti gradi di **Apex Italy RP** comunicano ufficialmente un **richiamo disciplinare** verso un membro dello Staff Team.\n\n` +
                `**Soggetto Sanzionato:** ${utente}\n` +
                `**Conteggio Strike:** \`${conteggio}\`\n\n` +
                avvertimento
            )
            .addFields(
                { name: '👤 Nominativo', value: `${utente}`, inline: true },
                { name: '📊 Situazione Strike', value: `\`${conteggio}\``, inline: true },
                { name: '📋 Infrazione Commessa', value: `\`\`\`${motivo}\`\`\``, inline: false }
            )
            .setColor(colore)
            .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
            .setAuthor({ name: `Provvedimento Disciplinare`, iconURL: interaction.user.displayAvatarURL() })
            .setFooter({ text: 'Apex Italy RP • Provvedimento Ufficiale' })
            .setTimestamp();

        await interaction.reply({ embeds: [embedPublic] });

        // 📋 LOG AMMINISTRATIVO - Registro disciplinare dettagliato
        const canaleLog = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.LOG_STAFF);
        if (canaleLog?.isTextBased()) {
            const embedLog = new EmbedBuilder()
                .setTitle('📋 ARCHIVIO: EMISSIONE STRIKE')
                .setColor(colore)
                .addFields(
                    { name: '🔐 Sanzionante', value: `${interaction.user}\n\`${interaction.user.id}\``, inline: false },
                    { name: '👤 Soggetto Sanzionato', value: `${utente}\n\`${utente?.id}\``, inline: false },
                    { name: '📊 Contatore Strike', value: `\`${conteggio}\``, inline: true },
                    { name: '🕐 Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '⚖️ Gravità Infrazione', value: isUltimo ? 'GRAVISSIMA (Ultimo Strike)' : 'Grave', inline: true },
                    { name: '📝 Infrazione Dettagliata', value: `\`\`\`${motivo}\`\`\``, inline: false }
                )
                .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
                .setFooter({ text: 'Sistema di Registrazione Staff - Confidenziale' })
                .setTimestamp();
            await canaleLog.send({ embeds: [embedLog] });
        }
    }
};
