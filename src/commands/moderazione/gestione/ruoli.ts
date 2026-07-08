import { 
    SlashCommandBuilder, 
    ChatInputCommandInteraction, 
    EmbedBuilder, 
    TextChannel, 
    GuildMember, 
    Role, 
    PermissionFlagsBits 
} from 'discord.js';

// Configurazione ID
const STAFF_ROLE_ID = '1521635837970747423';
const LOG_CHANNEL_ID = '1521636424426717288';

export const data = new SlashCommandBuilder()
    .setName('ruoli')
    .setDescription('Gestione avanzata ruoli staff')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles) // Visibile solo a chi può gestire ruoli di base
    .addSubcommand(subcommand =>
        subcommand
            .setName('aggiungi')
            .setDescription('Aggiunge uno o più ruoli a un utente')
            .addUserOption(opt => opt.setName('utente').setDescription('L\'utente a cui aggiungere i ruoli').setRequired(true))
            .addRoleOption(opt => opt.setName('ruolo1').setDescription('Primo ruolo da aggiungere').setRequired(true))
            .addStringOption(opt => opt.setName('motivo').setDescription('Il motivo dell\'aggiunta').setRequired(true))
            .addRoleOption(opt => opt.setName('ruolo2').setDescription('Secondo ruolo da aggiungere (opzionale)'))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('rimuovi')
            .setDescription('Rimuove uno o più ruoli a un utente')
            .addUserOption(opt => opt.setName('utente').setDescription('L\'utente a cui rimuovere i ruoli').setRequired(true))
            .addRoleOption(opt => opt.setName('ruolo1').setDescription('Primo ruolo da rimuovere').setRequired(true))
            .addStringOption(opt => opt.setName('motivo').setDescription('Il motivo della rimozione').setRequired(true))
            .addRoleOption(opt => opt.setName('ruolo2').setDescription('Secondo ruolo da rimuovere (opzionale)'))
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const { options, guild, member: executor } = interaction;

    // 1. Controllo Permessi (ID Ruolo Staff)
    const executorMember = executor as GuildMember;
    if (!executorMember.roles.cache.has(STAFF_ROLE_ID)) {
        return interaction.reply({ 
            content: '❌ Non hai il permesso di utilizzare questo comando (Ruolo Staff richiesto).', 
            ephemeral: true 
        });
    }

    const targetUser = options.getMember('utente') as GuildMember;
    const ruolo1 = options.getRole('ruolo1') as Role;
    const ruolo2 = options.getRole('ruolo2') as Role | null;
    const motivo = options.getString('motivo', true);
    const subcommand = options.getSubcommand();

    if (!targetUser) return interaction.reply({ content: 'Utente non trovato.', ephemeral: true });

    // Preparazione lista ruoli
    const rolesToProcess = [ruolo1];
    if (ruolo2) rolesToProcess.push(ruolo2);
    
    const rolesMentionList = rolesToProcess.map(r => `<@&${r.id}>`).join('\n');
    const actionType = subcommand === 'aggiungi' ? 'Aggiunta' : 'Rimozione';
    const embedColor = subcommand === 'aggiungi' ? 0x2ecc71 : 0xe74c3c; // Verde per aggiunta, Rosso per rimozione

    try {
        // Esecuzione azione sui ruoli
        if (subcommand === 'aggiungi') {
            await targetUser.roles.add(rolesToProcess);
        } else {
            await targetUser.roles.remove(rolesToProcess);
        }

        // 2. Creazione Embed per il Canale Corrente (Pubblico)
        const publicEmbed = new EmbedBuilder()
            .setTitle(`✨ Operazione Ruoli: ${actionType}`)
            .setColor(embedColor)
            .addFields(
                { name: '👤 Utente', value: `${targetUser}`, inline: true },
                { name: '🛡️ Ruoli coinvolti', value: rolesMentionList, inline: true },
                { name: '📝 Motivo', value: motivo }
            )
            .setTimestamp()
            .setFooter({ text: `Eseguito da: ${interaction.user.tag}` });

        await interaction.reply({ embeds: [publicEmbed] });

        // 3. Creazione Embed per i Logs Staff
        const logChannel = guild?.channels.cache.get(LOG_CHANNEL_ID) as TextChannel;
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle(`📑 Log Sistema - ${actionType}`)
                .setColor(embedColor)
                .addFields(
                    { name: 'Staffer', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: false },
                    { name: 'Utente Bersaglio', value: `${targetUser} (\`${targetUser.id}\`)`, inline: false },
                    { name: 'Ruoli', value: rolesMentionList, inline: false },
                    { name: 'Motivo', value: motivo, inline: false }
                )
                .setThumbnail(targetUser.user.displayAvatarURL())
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] });
        }

    } catch (error) {
        console.error(error);
        return interaction.reply({ 
            content: '❌ Errore: Assicurati che il mio ruolo sia più in alto dei ruoli che stai cercando di gestire.', 
            ephemeral: true 
        });
    }
}