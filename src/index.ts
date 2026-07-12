import { Client, GatewayIntentBits, Collection, REST, Routes, Events } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { CONFIG } from './utils/config';
import { initVotazioniDB } from './utils/votazioniDB';

const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '.env')
].filter((value, index, array) => array.indexOf(value) === index);

let resolvedEnvPath: string | undefined;
for (const candidate of envCandidates) {
    if (fs.existsSync(candidate)) {
        resolvedEnvPath = candidate;
        dotenv.config({ path: candidate });
        console.log(`🗂️ File .env caricato da: ${candidate}`);
        break;
    }
}

// ==========================================
// 🗄️ INIZIALIZZAZIONE DATABASE VOTAZIONI
// ==========================================
console.log(`🗄️ Inizializzazione database votazioni...`);
try {
    // Crea la cartella data se non esiste
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    initVotazioniDB();
    console.log(`✅ Database votazioni pronto!`);
} catch (error) {
    console.error(`❌ Errore inizializzazione database:`, error);
}

const token = (process.env.TOKEN || process.env.DISCORD_TOKEN || process.env.BOT_TOKEN || '').trim();
if (!token) {
    console.error(`❌ TOKEN non trovato. Imposta TOKEN, DISCORD_TOKEN o BOT_TOKEN in uno di questi file: ${envCandidates.join(', ')}`);
    process.exit(1);
}

// Estendiamo l'interfaccia di Client per includere la collezione dei comandi su TypeScript
class CustomClient extends Client {
    public commands: Collection<string, any> = new Collection();
}

const client = new CustomClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates, // 🔊 Mantenuto attivo per l'assistenza vocale
        GatewayIntentBits.MessageContent
    ]
});

process.on('uncaughtException', (error) => {
    console.error('❌ Errore non gestito:', error);
});

process.on('unhandledRejection', (reason) => {
    console.error('⚠️ Promise non gestita:', reason);
});

client.on(Events.Error, (error) => console.error('❌ Client error:', error));
client.on(Events.Warn, (warning) => console.warn('⚠️ Client warning:', warning));

// ==========================================
// 📁 FUNZIONE RICORSIVA CARICAMENTO COMANDI
// ==========================================
function prendiFileComandi(dirPath: string): string[] {
    let files: string[] = [];
    if (!fs.existsSync(dirPath)) return files;

    const elementi = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const elemento of elementi) {
        const res = path.resolve(dirPath, elemento.name);
        if (elemento.isDirectory()) {
            // Se trova una sottocartella (es. altro, gestione), ci entra dentro
            files = files.concat(prendiFileComandi(res));
        } else if (elemento.isFile() && (elemento.name.endsWith('.ts') || elemento.name.endsWith('.js'))) {
            files.push(res);
        }
    }
    return files;
}

const elencoComandi: any[] = [];
const percorsoComandi = path.join(__dirname, 'commands');
const fileComandi = prendiFileComandi(percorsoComandi);

console.log(`\n📦 Inizializzazione moduli di comando...`);

for (const file of fileComandi) {
    try {
        const modulo = require(file);
        const comando = (modulo && typeof modulo === 'object' && 'default' in modulo) ? modulo.default : modulo;
        
        if (comando && 'data' in comando && 'execute' in comando) {
            client.commands.set(comando.data.name, comando);
            elencoComandi.push(comando.data.toJSON());
            console.log(`🔹 [CARICATO] Comando: /${comando.data.name}`);
        } else {
            console.log(`⚠️ [SALTATO] Il file in ${file} non esporta correttamente 'data' o 'execute'.`);
        }
    } catch (error) {
        console.error(`❌ [ERRORE] Impossibile caricare il file ${file}:`, error);
    }
}

// ==========================================
// 📅 REGISTRAZIONE DEGLI EVENTI
// ==========================================
console.log(`\n📅 Inizializzazione moduli degli eventi...`);
const percorsoEventi = path.join(__dirname, 'events');

if (fs.existsSync(percorsoEventi)) {
    const fileEventi = fs.readdirSync(percorsoEventi).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    for (const file of fileEventi) {
        const moduloEvento = require(path.join(percorsoEventi, file));
        const evento = (moduloEvento && typeof moduloEvento === 'object' && 'default' in moduloEvento) ? moduloEvento.default : moduloEvento;
        
        const nomeEvento = typeof evento.name === 'string' ? evento.name : path.basename(file, path.extname(file));
        
        const handler = (...args: any[]) => {
            // Se l'evento è l'InteractionCreate (bottoni, modali, comandi slash)
            if (nomeEvento === Events.InteractionCreate) {
                const interaction = args[0];
                
                // Se è un comando slash (/), lo eseguiamo direttamente prendendolo dalla collezione comandi
                if (interaction.isChatInputCommand()) {
                    const command = client.commands.get(interaction.commandName);
                    if (command) {
                        return command.execute(interaction, client);
                    }
                }
            }

            // Esecuzione standard per gli altri file evento (es. voiceStateUpdate, guildMemberAdd)
            if (typeof evento.execute === 'function') {
                return evento.execute(...args, client);
            }
            if (typeof evento.handleInteraction === 'function') {
                return evento.handleInteraction(...args, client);
            }
            return undefined;
        };

        if (evento.once) {
            client.once(nomeEvento, handler);
        } else {
            client.on(nomeEvento, handler);
        }
        console.log(`🔸 [REGISTRATO] Evento: ${nomeEvento}`);
    }
}

// ==========================================
// 🚀 DEPLOY DEI COMANDI SULLE API DISCORD & LOGIN
// ==========================================
client.once(Events.ClientReady, async () => {
    console.log(`\n🤖 ${client.user?.tag} è ufficialmente ONLINE su Apex Italy RP!`);

    const rest = new REST({ version: '10' }).setToken(token);

    try {
        console.log(`⏳ Aggiornamento dell'applicazione (/) in corso...`);

        const CLIENT_ID = client.user?.id;
        const GUILD_ID = process.env.GUILD_ID;

        if (CLIENT_ID && elencoComandi.length > 0) {
            const route = GUILD_ID
                ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
                : Routes.applicationCommands(CLIENT_ID);

            await rest.put(route, { body: elencoComandi });
            console.log(`✅ Applicazione aggiornata con successo! ${elencoComandi.length} comandi registrati.`);
        }
    } catch (error) {
        console.error(`❌ Errore durante il deploy dei comandi (Slash Commands):`, error);
    }
});

void client.login(token).catch((error) => {
    console.error('❌ Login fallito: il token Discord è invalido, scaduto o non corrisponde al bot.', error);
    process.exit(1);
});
