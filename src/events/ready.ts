import { Client, Events, ActivityType, EmbedBuilder, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState, StreamType } from '@discordjs/voice';
import { CONFIG } from '../utils/config';
import * as https from 'https';
import * as http from 'http';

export const name = Events.ClientReady;
export const once = true;

// Fetches a URL and returns a readable IncomingMessage stream, following redirects.
// Rejects if the response status is not 2xx or if the request errors out.
function fetchStream(url: string): Promise<http.IncomingMessage> {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot/1.0)',
                'Accept': 'audio/mpeg, audio/*, */*'
            }
        }, (res) => {
            // Follow up to one redirect (301/302/307/308)
            if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) && res.headers.location) {
                res.resume(); // Drain the redirect response body
                console.log(`🔀 [Audio] Redirect → ${res.headers.location}`);
                fetchStream(res.headers.location).then(resolve).catch(reject);
                return;
            }
            if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
                res.resume();
                reject(new Error(`HTTP ${res.statusCode} per URL: ${url}`));
                return;
            }
            console.log(`✅ [Audio] Stream aperto — HTTP ${res.statusCode}, Content-Type: ${res.headers['content-type'] ?? 'sconosciuto'}`);
            resolve(res);
        });
        req.on('error', reject);
        req.setTimeout(15_000, () => {
            req.destroy(new Error(`Timeout connessione per URL: ${url}`));
        });
    });
}

export async function execute(client: Client) {
    // 1. Log di conferma nel terminale ad avvio avvenuto
    console.log(`🟢 Apex Italy RP Bot è ONLINE! Autenticato come: ${client.user?.tag}`);

    // 2. Imposta lo stato del Bot
    client.user?.setActivity('https://discord.gg/ZPncAXjqwA', { type: ActivityType.Listening });

    // Prende il primo server in cui si trova il bot per gestire canali e vocali
    const guild = client.guilds.cache.first();
    if (!guild) {
        console.log("⚠️ Impossibile trovare un server per configurare le funzioni automatiche.");
        return;
    }

    // =========================================================================
    // 3. AVVIO RIPRODUTTORE VOCALE CONTINUO (Canale Vocale Attesa)
    // =========================================================================
    const voiceChannelId = CONFIG.CHANNELS.VOCALE_ATTESA;

    try {
        const voiceChannel = await guild.channels.fetch(voiceChannelId).catch(() => null);

        if (!voiceChannel || !('isVoiceBased' in voiceChannel) || !voiceChannel.isVoiceBased()) {
            console.log(`⚠️ Impossibile trovare o utilizzare il canale vocale ${voiceChannelId}.`);
            return;
        }

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: false
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

        const player = createAudioPlayer();
        const musicUrls = [
            'https://s74.notube.link/download.php?token=b54c260008b277aca6cd8aba6299d0b8&key=v654wd7ea140vmt3&file=musica%2Fapexitalyrp.mp3',
            'https://s74.notube.link/download.php?token=3e5f8c0b8d9f4a1b9c2e7f6d5a4b3c2d&key=v654wd7ea140vmt3&file=musica%2Fapexitalyrp2.mp3',
            'https://s74.notube.link/download.php?token=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p&key=v654wd7ea140vmt3&file=musica%2Fapexitalyrp3.mp3'
        ];
        let musicIndex = 0;
        let retryCount = 0;
        const MAX_RETRIES = 5;
        let isPlaying = false;

        const playStream = async () => {
            const selectedUrl = musicUrls[musicIndex];
            const trackNumber = musicIndex + 1;
            musicIndex = (musicIndex + 1) % musicUrls.length;

            console.log(`🎵 [Audio] Tentativo di riproduzione traccia ${trackNumber}/${musicUrls.length}: ${selectedUrl}`);

            try {
                const stream = await fetchStream(selectedUrl);

                // StreamType.Arbitrary tells @discordjs/voice to pass the stream
                // through ffmpeg for transcoding — required for raw MP3 over HTTP.
                const resource = createAudioResource(stream, {
                    inputType: StreamType.Arbitrary,
                    inlineVolume: false
                });

                resource.playStream.on('error', (err) => {
                    console.error(`❌ [Audio] Errore nello stream di riproduzione: ${err.message}`);
                });

                player.play(resource);
                retryCount = 0; // Reset retry counter on successful play attempt
            } catch (err: any) {
                console.error(`❌ [Audio] Impossibile aprire lo stream per la traccia ${trackNumber}: ${err.message}`);
                retryCount++;
                if (retryCount >= MAX_RETRIES) {
                    console.error(`❌ [Audio] Raggiunti ${MAX_RETRIES} tentativi falliti consecutivi. Pausa di 60 secondi prima di riprovare.`);
                    retryCount = 0;
                    setTimeout(() => playStream(), 60_000);
                } else {
                    // Exponential backoff: 5s, 10s, 20s, 40s…
                    const delay = 5_000 * Math.pow(2, retryCount - 1);
                    console.log(`⏳ [Audio] Nuovo tentativo tra ${delay / 1000}s (tentativo ${retryCount}/${MAX_RETRIES})...`);
                    setTimeout(() => playStream(), delay);
                }
            }
        };

        player.on(AudioPlayerStatus.Playing, () => {
            isPlaying = true;
            console.log('▶️  [Audio] Riproduzione avviata con successo.');
        });

        player.on(AudioPlayerStatus.Idle, () => {
            if (isPlaying) {
                console.log('🎵 [Audio] Traccia terminata. Caricamento traccia successiva...');
            } else {
                console.warn('⚠️  [Audio] Il player è tornato Idle senza mai riprodurre — possibile problema con lo stream.');
            }
            isPlaying = false;
            playStream();
        });

        player.on('error', (error: any) => {
            console.error(`❌ [Audio] Errore nel riproduttore: ${error.message}`);
            if (error.resource) {
                console.error(`   Risorsa coinvolta: ${error.resource.metadata ?? 'N/A'}`);
            }
            isPlaying = false;
            retryCount++;
            const delay = Math.min(5_000 * Math.pow(2, retryCount - 1), 60_000);
            console.log(`⏳ [Audio] Nuovo tentativo tra ${delay / 1000}s...`);
            setTimeout(() => playStream(), delay);
        });

        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Ready, 5_000),
                    entersState(connection, VoiceConnectionStatus.Disconnected, 5_000)
                ]);
            } catch {
                connection.destroy();
            }
        });

        connection.subscribe(player);
        playStream();

        console.log(`🎵 [Audio Loop] Connesso al canale vocale ${voiceChannelId} - Avvio riproduzione...`);
    } catch (error) {
        console.error('❌ Errore durante la connessione al canale vocale:', error);
    }

    // =========================================================================
    // 4. INVIO MESSAGGIO UTILITY PER IL NICKNAME (Se il canale è vuoto)
    // =========================================================================
    const setupChannelId = CONFIG.CHANNELS.SETUP_NICKNAME;
    const setupChannel = guild.channels.cache.get(setupChannelId) as TextChannel;
    
    if (setupChannel) {
        try {
            // Controlla gli ultimi messaggi nel canale per evitare di inviarlo duplicato ad ogni riavvio
            const messages = await setupChannel.messages.fetch({ limit: 10 });
            
            if (messages.size === 0) {
                const nickEmbed = new EmbedBuilder()
                    .setTitle('⚙️ SINCRO NICKNAME • FORMATTAZIONE FONT')
                    .setColor(CONFIG.COLORS.TORINO_RED)
                    .setDescription('Clicca sul pulsante rosso sottostante per formattare automaticamente il tuo Nickname in questo server con il tag del tuo **Grado Staff più alto** in stile ǫᴜᴇꜱᴛᴏ ꜰᴏɴᴛ.')
                    .addFields(
                        { name: '📋 Come funziona?', value: 'Il sistema analizzerà i tuoi ruoli correnti e anteporrà al tuo nome il tag stilizzato del tuo ruolo (Es: `[ꜱᴛᴀꜰꜰ] Nome`).\nSe cambi di grado, ti basterà ricliccare il pulsante.' }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Torino RP • Utility Automatiche Staff' });

                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId('setup_nickname_font')
                        .setLabel('Sincronizza e Formatta Nome')
                        .setStyle(ButtonStyle.Danger) // Bottone Rosso
                );

                await setupChannel.send({ embeds: [nickEmbed], components: [row] });
                console.log(`📢 [Setup Nickname] Messaggio iniziale inviato con successo nel canale ${setupChannelId}.`);
            } else {
                console.log("ℹ️ [Setup Nickname] Il canale contiene già dei messaggi. Invio saltato per evitare duplicati.");
            }
        } catch (error) {
            console.error("❌ Errore durante il setup del canale Nickname:", error);
        }
    } else {
        console.log(`⚠️ Impossibile trovare il canale di setup nickname con ID: ${setupChannelId}`);
    }
}
