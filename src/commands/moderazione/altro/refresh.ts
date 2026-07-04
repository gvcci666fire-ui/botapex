import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder, 
    EmbedBuilder, 
    MessageFlags, 
    TextChannel 
} from 'discord.js';
import { CONFIG } from '../../../utils/config';

// Mappa in memoria per tracciare i cooldown degli utenti (UserID -> Timestamp di sblocco)
const cooldowns = new Map<string, number>();
const TEMPO_COOLDOWN = 10 * 60 * 1000; // 10 minuti espressi in millisecondi

export const data = new SlashCommandBuilder()
    .setName('refresh')
    .setDescription('Esegue il refresh del tuo personaggio in-game per ricaricare vestiti o bug grafici.')
    .addStringOption(option => 
        option.setName('username')
            .setDescription('Il tuo nome utente esatto su Roblox')
            .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const userId = interaction.user.id;
    const adesso = Date.now();
    const usernameRoblox = interaction.options.getString('username', true);

    // ⏳ CONTROLLO DEL COOLDOWN (10 Minuti)
    if (cooldowns.has(userId)) {
        const tempoSblocco = cooldowns.get(userId)!;

        if (adesso < tempoSblocco) {
            const millisecondiRimasti = tempoSblocco - adesso;
            const minutiRimasti = Math.floor(millisecondiRimasti / 60000);
            const secondiRimasti = Math.floor((millisecondiRimasti % 60000) / 1000);

            return void await interaction.editReply({ 
                content: `⏳ **Richiesta respinta per rate-limit.**\nPuoi eseguire il refresh del tuo personaggio una volta ogni 10 minuti. Riprova tra **${minutiRimasti}m e ${secondiRimasti}s**.` 
            });
        }
    }

    try {
        // 🌐 Chiamata POST verso l'endpoint ufficiale di ER:LC
        const response = await fetch('https://api.policeroleplay.community/v1/server/command', {
            method: 'POST',
            headers: {
                'Server-Key': CONFIG.ERLC_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                command: `:refresh ${usernameRoblox}`
            })
        });

        if (!response.ok) {
            return void await interaction.editReply({ 
                content: `❌ Il sistema centrale di ER:LC non ha risposto correttamente (Codice: \`${response.status}\`). Segnala il problema allo staff.` 
            });
        }

        // 📝 Se la chiamata ha successo, facciamo scattare il Cooldown per questo utente
        cooldowns.set(userId, adesso + TEMPO_COOLDOWN);

        // 🎨 Invio del log di monitoraggio pubblico/staff nel canale log votazioni o comandi
        const canaleLog = interaction.client.channels.cache.get(CONFIG.CHANNELS.LOGS_VOTAZIONI) as TextChannel;
        
        const embedLog = new EmbedBuilder()
            .setTitle('🔄 REFRESH CITTADINO • ERLC API')
            .setDescription(`Un utente ha richiesto autonomamente il refresh del proprio avatar in gioco.`)
            .setColor('#3498db')
            .addFields(
                { name: '┃ ACCOUNT DISCORD', value: `<@${userId}> (\`${userId}\`)`, inline: true },
                { name: '┃ TARGET ROBLOX', value: `\`\`\`yaml\n${usernameRoblox}\n\`\`\``, inline: true }
            )
            .setFooter({ text: 'Moduli Automatici Cdf • Apex Italy RP', iconURL: interaction.guild?.iconURL() || undefined })
            .setTimestamp();

        if (canaleLog && typeof canaleLog.send === 'function') {
            await canaleLog.send({ embeds: [embedLog] });
        }

        await interaction.editReply({ 
            content: `✅ Richiesta inviata! Il personaggio collegato a **${usernameRoblox}** è stato aggiornato sul posto. Se non vedi modifiche, assicurati che il nome inserito sia corretto.` 
        });

    } catch (error) {
        console.error('Errore API ERLC:', error);
        await interaction.editReply({ content: '❌ Impossibile comunicare con il server di Roblox in questo momento. Riprova più tardi.' });
    }
}