import { Client, GatewayIntentBits, Collection, REST, Routes, Events } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from './utils/config';

// Estendiamo l'interfaccia di Client per includere la collezione dei comandi su TypeScript
class CustomClient extends Client {
    public commands: Collection<string, any> = new Collection();
}

const client = new CustomClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
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
        const evento = require(path.join(percorsoEventi, file));
        const nomeEvento = typeof evento.name === 'string' ? evento.name : path.basename(file, path.extname(file));
        const handler = (...args: any[]) => {
            if (typeof evento.execute === 'function') {
                return evento.execute(...args);
            }
            if (typeof evento.handleInteraction === 'function') {
                return evento.handleInteraction(...args);
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

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN || CONFIG.TOKEN);

    try {
        console.log(`⏳ Aggiornamento dell'applicazione (/) in corso...`);

        const CLIENT_ID = client.user?.id;
        const GUILD_ID = CONFIG.GUILD_ID || process.env.GUILD_ID;

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

void client.login(process.env.TOKEN || CONFIG.TOKEN).catch((error) => {
    console.error('❌ Login fallito:', error);
    process.exit(1);
});