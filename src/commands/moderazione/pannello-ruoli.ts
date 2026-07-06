import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';

const ROLE_BUTTONS = [
    { label: '🕓 Ping SSU & SSD', roleId: '1521635928269914303' },
    { label: '👀 Ping Spoiler', roleId: '1521635929473945671' },
    { label: '📊 Ping Sondaggi', roleId: '1521635930861994076' },
    { label: '📰 Ping News', roleId: '1521635933588426763' },
    { label: '📣 Ping Annunci', roleId: '1521635934506979419' },
    { label: '🎁 Ping Giveaways', roleId: '1521635936574640148' },
    { label: '🟢 Ping Status Servers', roleId: '1521635937296060600' },
    { label: '🗞️ Ping Changelogs', roleId: '1521635938109755454' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pannello-ruoli')
        .setDescription('Invia il pannello per ottenere i ruoli di notifica')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ Solo gli amministratori possono usare questo comando.', flags: ['Ephemeral'] });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎭 Auto-Role Apex Italy RP')
            .setDescription('Clicca sui pulsanti per aggiungere o rimuovere i ruoli di notifica che preferisci.')
            .setColor('#5865f2')
            .setFooter({ text: 'Apex Italy RP • Ping Roles' });

        const rows: ActionRowBuilder<ButtonBuilder>[] = [];
        for (let i = 0; i < ROLE_BUTTONS.length; i += 2) {
            const chunk = ROLE_BUTTONS.slice(i, i + 2);
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                ...chunk.map((button) =>
                    new ButtonBuilder()
                        .setCustomId(`role_toggle_${button.roleId}`)
                        .setLabel(button.label)
                        .setStyle(ButtonStyle.Primary)
                )
            );
            rows.push(row);
        }

        await interaction.reply({ content: '✅ Pannello inviato con successo!', flags: ['Ephemeral'] });
        await interaction.channel?.send({ embeds: [embed], components: rows });
    }
};
