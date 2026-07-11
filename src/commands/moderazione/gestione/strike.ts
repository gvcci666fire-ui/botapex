import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client } from 'discord.js';
import { CONFIG } from '../../../utils/config';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('strike')
        .setDescription('Assegna un richiamo ufficiale (Strike) a uno staffer')
        .addUserOption(opt => opt.setName('utente').setDescription('Lo staffer da richiamare').setRequired(true))
        .addStringOption(opt => opt.setName('conteggio').setDescription('Situazione Strike (es. 1/4, 2/4, 3/4, 4/4)').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Causa dettagliata del richiamo').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const utente = interaction.options.getUser('utente');
        const conteggio = interaction.options.getString('conteggio');
        const motivo = interaction.options.getString('motivo');

        // Validazione conteggio
        const validiConteggi = ['1/4', '2/4', '3/4', '4/4'];
        if (!validiConteggi.includes(conteggio)) {
            await interaction.reply({ 
                content: '❌ Conteggio non valido. Usa: 1/4, 2/4, o 3/4. Il 4/4 indica licenziamento immediato o la sospensione.', 
                ephemeral: true 
            });
            return;
        }

        const isUltimo = conteggio === '4/4';
        const colore = isUltimo ? '#c0392b' : '#e74c3c';
        const avvertimento = isUltimo ? '🚨 **Avverimento**' : ' **Al 4 strike ci sarà il licenziamento o la sospensione dal servizio se meno grave..'

        // ⚠️ CANALE PUBBLICO - Comunicazione disciplinare
        const embedPublic = new EmbedBuilder()
            .setTitle(`⚠️ Nuova Gestione • Strike Staff`)
            .setDescription(
                `**Comunicazione Ufficiale della Direzione**\n\n` +
                `Gli alti gradi di **Apex Italy RP** comunicano ufficialmente un **richiamo disciplinare** verso un membro dello Staff Team.\n\n` +
                avvertimento
            )
            .addFields(
                { name: '👤 Staffer', value: `${utente}`, inline: true },
                { name: '📊 Situazione Strike', value: `\`${conteggio}\``, inline: true },
                { name: '📋 Motivazione Strike', value: `\`\`\`${motivo}\`\`\``, inline: false }
            )
            .setColor(colore)
            .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
            .setAuthor({ name: `Provvedimento Disciplinare`, iconURL: interaction.user.displayAvatarURL() })
            .setFooter({ text: 'Apex Italy RP • Provvedimento Ufficiale' })
            .setTimestamp();

        await interaction.reply({ embeds: [embedPublic] });
    }
};