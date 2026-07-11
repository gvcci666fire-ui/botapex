import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client } from 'discord.js';
import { CONFIG } from '../../../utils/config';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('licenziamento')
        .setDescription('Rimuove definitivamente un membro dall\'organico staff')
        .addUserOption(opt => opt.setName('utente').setDescription('Lo staffer da licenziare').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Il motivo del licenziamento (obbligatorio)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const utente = interaction.options.getUser('utente');
        const motivo = interaction.options.getString('motivo');

        // 🚨 CANALE PUBBLICO - Comunicazione seria e definitiva
        const embedPublic = new EmbedBuilder()
            .setTitle('🚨 Nuova Gestione • Licenziamento Staff')
            .setDescription(
                `**Comunicazione Ufficiale della Direzione**\n\n` +
                `La direzione di **Apex Italy RP** comunicano ufficialmente il **licenziamento** di un membro dello Staff Team.\n\n` +
                `La suddetta persona viene sollevata con effetto **IMMEDIATO** da qualunque mansione, incarico, accesso e responsabilità della struttura dello staff.`
            )
            .addFields(
                { name: '👤 Staffer', value: `${utente}`, inline: false },
                { name: '🚫 Motivo Licenziamento', value: `\`\`\`${motivo}\`\`\``, inline: false },
                { name: '⚠️ Avviso', value: `Provvedimento definitivo e senza appello`, inline: false }
            )
            .setColor('#c0392b')
            .setThumbnail(utente?.displayAvatarURL({ forceStatic: false }) || null)
            .setAuthor({ name: `Decisione Direzione Staff`, iconURL: interaction.user.displayAvatarURL() })
            .setFooter({ text: 'Apex Italy RP • Provvedimento Ufficiale' })
            .setTimestamp();

        await interaction.reply({ embeds: [embedPublic] });
    }
}