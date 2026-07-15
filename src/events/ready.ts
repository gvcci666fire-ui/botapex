import {
  Client,
  Events,
  ActivityType,
  EmbedBuilder,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
  VoiceConnection,
  AudioPlayer,
} from '@discordjs/voice';
import * as play from 'play-dl';
import { CONFIG } from '../utils/config';

export const name = Events.ClientReady;
export const once = true;

/* -------------------------------------------------------------------------- */
/* 🎵 Helper: estrai l'ID video da un URL YouTube                              */
/* -------------------------------------------------------------------------- */
function getYouTubeVideoId(input: string): string | null {
  // Riconosce:
  //   https://www.youtube.com/watch?v=ID
  //   https://youtu.be/ID
  //   https://www.youtube.com/embed/ID
  //   https://www.youtube.com/v/ID
  //   (con eventuali parametri aggiuntivi)
  const match = input.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  return match ? match[1] : null;
}

/* -------------------------------------------------------------------------- */
/* 🚀 Esecuzione dell'evento ready                                            */
/* -------------------------------------------------------------------------- */
export async function execute(client: Client) {
  console.log(
    `🟢 Apex Italy RP Bot è ONLINE! Autenticato come: ${client.user?.tag}`
  );

  client.user?.setActivity(
    'https://discord.gg/ZPncAXjqwA',
    { type: ActivityType.Listening }
  );

  const guild = client.guilds.cache.first();
  if (!guild) {
    console.log(
      '⚠️ Impossibile trovare un server per configurare le funzioni automatiche.'
    );
    return;
  }

  /* ======================================================== */
  /* 🎵 AVVIO RIPRODUTTORE VOCALE CONTINUO CON play-dl       */
  /* ======================================================== */
  const voiceChannelId = CONFIG.CHANNELS.VOCALE_ATTESA;

  try {
    const voiceChannel = await guild.channels
      .fetch(voiceChannelId)
      .catch(() => null);

    if (
      !voiceChannel ||
      !('isVoiceBased' in voiceChannel) ||
      !voiceChannel.isVoiceBased()
    ) {
      console.error(
        `❌ [AUDIO CRITICO] Canale vocale ${voiceChannelId} non trovato o non valido!`
      );
      return;
    }

    let connection: VoiceConnection | null = null;
    let player: AudioPlayer | null = null;
    let isDestroyed = false;

    /* ------------------------------------------------------------------
       🧹 Pulizia risorse (non tocca il flag di distruzione)
       ------------------------------------------------------------------ */
    const cleanup = () => {
      if (player) {
        try {
          player.stop();
        } catch (_) {}
        player.removeAllListeners();
        player = null;
      }
      if (connection) {
        try {
          connection.destroy();
        } catch (_) {}
        connection.removeAllListeners();
        connection = null;
      }
    };

    const startMusicPlayer = async () => {
      if (isDestroyed) return;

      try {
        // Puliamo eventuali risorse precedenti
        cleanup();
        isDestroyed = false;

        // --------------------------------------------------------------
        // 1️⃣ Connessione vocale
        // --------------------------------------------------------------
        connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
          selfDeaf: true,
          selfMute: false,
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
        console.log(
          `✅ [AUDIO] Connessione stabilita al canale vocale ${voiceChannelId}`
        );

        player = createAudioPlayer();

        // --------------------------------------------------------------
        // 2️⃣ Playlist YouTube (array di URL)
        // --------------------------------------------------------------
        const musicPlaylist = [
          'https://www.youtube.com/watch?v=6wufZNh2Hx8&list=RD6wufZNh2Hx8&start_radio=1',
          'https://www.youtube.com/watch?v=eXOQVtsgQpA&list=RDeXOQVtsgQpA&start_radio=1',
          'https://www.youtube.com/watch?v=u0qJmsmbTRY&list=RDu0qJmsmbTRY&start_radio=1',
        ];

        let playlistIndex = 0;          // indice corrente della playlist
        let retryCount = 0;             // tentativi di riproduzione per la traccia corrente
        const MAX_RETRIES = 3;

        /* --------------------------------------------------------------
           🎧 Funzione interna: riproduce la traccia successiva
           -------------------------------------------------------------- */
        const playNextTrack = async () => {
          if (isDestroyed || !player || !connection) return;
          if (connection.state.status !== VoiceConnectionStatus.Ready) {
            console.warn(
              '⚠️ [AUDIO] Connessione non pronta, tentativo in 2 secondi…'
            );
            setTimeout(playNextTrack, 2000);
            return;
          }

          try {
            // Reset contatore retry per ogni nuova traccia
            retryCount = 0;

            // 1️⃣ Prendi l'URL successivo dalla playlist
            const rawUrl =
              musicPlaylist[playlistIndex % musicPlaylist.length];
            playlistIndex++; // avanzo per il prossimo giro

            // 2️⃣ Estrai l'ID video – se fallisce, segnala l'errore
            const videoId = getYouTubeVideoId(rawUrl);
            if (!videoId) {
              throw new Error(
                `URL non riconoscibile come video YouTube: "${rawUrl}"`
              );
            }

            console.log(
              `🎵 [AUDIO] Caricamento traccia ${(playlistIndex - 1) % musicPlaylist.length + 1}/${
                musicPlaylist.length
              } (ID: ${videoId})…`
            );

            // 3️⃣ Ottieni le informazioni sul video (controlla disponibilità, età, ecc.)
            const info = await play.video_basic_info(videoId, {
              // Se hai i cookie per contenuti age‑restricted, decommenta:
              // headers: { cookie: process.env.YT_COOKIES ?? '' },
            });

            // Controllo difensivo sulle informazioni ricevute
            if (!info?.video_details?.id) {
              throw new Error('Impossibile ottenere le informazioni sul video');
            }

            // 4️⃣ Verifica che esista almeno un formato riproducibile
            //    In play-dl v4 i formati possono essere sotto `info.format` (array) oppure
            //    sotto `info.formats` (se presente). Gestiamo entrambi i casi.
            const rawFormats =
              Array.isArray(info.format) ? info.format : info.format;
            const formats = Array.isArray(rawFormats)
              ? rawFormats
              : rawFormats
              ? [rawFormats]
              : [];

            if (!formats || formats.length === 0) {
              throw new Error(
                'Nessun formato riproducibile trovato (video forse rimosso o age‑restretto)'
              );
            }

            // 5️⃣ Ottieni lo stream vero e proprio da play-dl
            //    La funzione `stream` accetta una **stringa URL** (non l'oggetto info)
            const streamResult = await play.stream(
              `https://www.youtube.com/watch?v=${videoId}`
            );
            if (!streamResult || !streamResult.stream) {
              throw new Error('Stream restituito da play-dl è vuoto');
            }

            const resource = createAudioResource(streamResult.stream, {
              inputType: streamResult.type,
              inlineVolume: true,
            });

            resource.volume?.setVolume(0.5); // volume moderato
            player.play(resource);

            console.log(
              `✅ [AUDIO] In riproduzione: ${
                info.video_details.title ?? '(senza titolo)'
              }`
            );
          } catch (err) {
            console.error(`❌ [AUDIO] Errore nella riproduzione:`, err);
            retryCount++;

            if (retryCount < MAX_RETRIES) {
              console.log(
                `🔄 [AUDIO] Tentativo di recupero ${retryCount}/${MAX_RETRIES} tra 3 secondi…`
              );
              setTimeout(playNextTrack, 3000);
            } else {
              console.warn(
                `⚠️ [AUDIO] Max retry raggiunto, passo alla traccia successiva…`
              );
              // Passiamo semplicemente alla traccia successiva (playlistIndex già incrementato)
              setTimeout(playNextTrack, 5000);
            }
          }
        };

        // --------------------------------------------------------------
        // 🎧 Listener del player
        // --------------------------------------------------------------
        player.on(AudioPlayerStatus.Idle, () => {
          if (!isDestroyed) {
            console.log(
              '🎵 [AUDIO] Traccia completata, avvio della successiva…'
            );
            playNextTrack().catch(console.error);
          }
        });

        player.on('error', (error) => {
          console.error(`❌ [AUDIO] Errore player:`, error);
          if (!isDestroyed)
            setTimeout(() => playNextTrack().catch(console.error), 5000);
        });

        // Collegamento player → connessione vocale
        connection.subscribe(player);

        // Avvia la prima traccia
        await playNextTrack();

        // --------------------------------------------------------------
        // 🔌 Listener della connessione vocale
        // --------------------------------------------------------------
        connection.on(VoiceConnectionStatus.Disconnected, () => {
          console.warn(
            `⚠️ [AUDIO] Disconnessione rilevata. Riconnessione in 5 secondi…`
          );
          setTimeout(() => {
            if (!isDestroyed) startMusicPlayer().catch(console.error);
          }, 5000);
        });

        connection.on(VoiceConnectionStatus.Destroyed, () => {
          console.error(`❌ [AUDIO] Connessione distrutta!`);
          isDestroyed = true;
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
          console.log(`✅ [AUDIO] Connessione stabile e pronta`);
        });
      } catch (error) {
        console.error('❌ [AUDIO CRITICO] Errore fatale:', error);
        cleanup();
        if (!isDestroyed) {
          console.log(
            '🔄 [AUDIO] Riavvio completo tra 15 secondi…'
          );
          setTimeout(startMusicPlayer, 15_000);
        }
      }
    };

    // Avvio iniziale del player musicale
    await startMusicPlayer();
  } catch (error) {
    console.error('❌ [AUDIO CRITICO] Configurazione fallita:', error);
  }

  /* ======================================================== */
  /* 🏷️ SETUP NICKNAME                                        */
  /* ======================================================== */
  const setupChannelId = CONFIG.CHANNELS.SETUP_NICKNAME;
  const setupChannel = guild.channels.cache.get(
    setupChannelId
  ) as TextChannel;

  if (setupChannel) {
    try {
      const messages = await setupChannel.messages.fetch({ limit: 10 });

      if (messages.size === 0) {
        const nickEmbed = new EmbedBuilder()
          .setTitle('⚙️ SINCRO NICKNAME • FORMATTAZIONE FONT')
          .setColor(CONFIG.COLORS.TORINO_RED)
          .setDescription(
            'Clicca sul pulsante rosso sottostante per formattare automaticamente il tuo Nickname in questo server con il tag del tuo **Grado Staff più alto** in stile ǫᴜᴇꜱᴛᴏ ꜰᴏɴᴛ.'
          )
          .addFields({
            name: '📋 Come funziona?',
            value:
              'Il sistema analizzerà i tuoi ruoli correnti e anteporrà al tuo nome il tag stilizzato del tuo ruolo (Es: `[ꜱᴛᴀꜰꜟ] Nome`).\\nSe cambi di grado, ti basterà ricliccare il pulsante.',
          })
          .setTimestamp()
          .setFooter({
            text: 'Apex Italy RP • Utility Automatiche Staff',
          });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('setup_nickname_font')
            .setLabel('Sincronizza e Formatta Nome')
            .setStyle(ButtonStyle.Danger)
        );

        await setupChannel.send({ embeds: [nickEmbed], components: [row] });
        console.log(`📢 Setup nickname completato`);
      }
    } catch (error) {
      console.error('❌ Errore setup nickname:', error);
    }
  }
}
