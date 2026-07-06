import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-nickname')
        .setDescription('Invia il pannello fisso per il setup del nickname RP')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // 🔒 Lucchetto 1: Nasconde il comando ai non-admin su Discord

    async execute(interaction: ChatInputCommandInteraction) {
        
        // 🔒 Lucchetto 2: Controllo di sicurezza forzato nel codice
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: "❌ Errore: Questo comando può essere eseguito solo dagli Amministratori del server.",
                flags: ['Ephemeral']
            });
        }

        // Se è un admin, il codice prosegue normalmente e invia il pannello
        const embed = new EmbedBuilder()
            .setTitle('📝 Cambio Automatico Nickname Staffer')
            .setDescription(
                'Benvenuto sul pannello nick-staff di **Apex Italy RP**!\n\n' +
                'Imposta il tuo nickname staffer con un solo bottone..\n\n' +
                '📌 **Regola:** Il vostro nome non deve essere lungo se possedete un grado di grande lunghezza.\n' +
                '-# 🛑 Se il bot presenta un bug, sei pregato di avvertire i developer bot.'
            )
            .setColor('#2f3136')
            .setFooter({ text: 'Apex RP • Sistema di Registrazione Automatizzato' });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('setup_nickname_font')
                .setLabel('Imposta Nickname')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🆔')
        );

        await interaction.reply({ content: '✅ Pannello di setup inviato con successo!', flags: ['Ephemeral'] });
        await interaction.channel?.send({ embeds: [embed], components: [row] });
    }
};