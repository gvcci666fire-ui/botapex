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
import { CONFIG } from '../utils/config';

export const name = Events.ClientReady;
export const once = true;

export async function execute(client: Client) {
  // -------------------------------------------------
  // 1️⃣  Log di conferma nel terminale
  // -------------------------------------------------
  console.log(`🟢 Apex Italy RP Bot è ONLINE! Autenticato come: ${client.user?.tag}`);

  // -------------------------------------------------
  // 2️⃣  Imposta lo stato del Bot
  // -------------------------------------------------
  client.user?.setActivity('https://discord.gg/ZPncAXjqwA', { type: ActivityType.Listening });

  // -------------------------------------------------
  // 3️⃣  Prendi il primo guild (server) dove il bot è presente
  // -------------------------------------------------
  const guild = client.guilds.cache.first();
  if (!guild) {
    console.log('⚠️ Impossibile trovare un server per configurare le funzioni automatiche.');
    return;
  }

  // =========================================================
  // 4️⃣  AVVIO RIPRODUTTORE VOCALE CONTINUO (Canale Vocale Attesa)
  // =========================================================
  const voiceChannelId = CONFIG.CHANNELS.VOCALE_ATTESA;   // <-- assicurati che sia corretto in config.ts

  try {
    const voiceChannel = await guild.channels.fetch(voiceChannelId).catch(() => null);

    // Controllo preliminare: il canale deve esistere e essere vocale
    if (!voiceChannel || !('isVoiceBased' in voiceChannel) || !voiceChannel.isVoiceBased()) {
      console.log(`⚠️ Impossibile trovare o utilizzare il canale vocale ${voiceChannelId}.`);
      return;
    }

    // ------------------- variabili di stato -------------------
    let connection: VoiceConnection | null = null;
    let player: AudioPlayer | null = null;
    let isDestroyed = false;

    // ------------------- pulizia risorse -------------------
    const cleanup = () => {
      if (player) {
        try { player.stop(); } catch (_) {}
        player.removeAllListeners();
        player = null;
      }
      if (connection) {
        try { connection.destroy(); } catch (_) {}
        connection.removeAllListeners();
        connection = null;
      }
      isDestroyed = true;
    };

    // ------------------- avvio/riavvio riproduttore -------------------
    const startMusicPlayer = async () => {
      if (isDestroyed) return;

      try {
        // Pulizia preventiva (evita doppi listener / connessioni zombie)
        cleanup();
        isDestroyed = false; // cleanup() imposta isDestroyed = true, va resettato per il nuovo avvio

        // 1️⃣ Connessione vocale
        connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
          selfDeaf: true,   // il bot non sente se stesso (evita eco)
          selfMute: false,
        });

        // Attendiamo che la connessione sia pronta
        await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
        console.log(`🎵 [Audio Loop] Connesso al canale vocale ${voiceChannelId}`);

        // 2️⃣ Player audio
        player = createAudioPlayer();

        // ▼▼▼ PLAYLIST CORRETTA CON URL RAW DI GITHUB ▼▼▼
        const musicUrls: string[] = [
          // PRIMO BRANO - URL RAW da GitHub (quello funzionava già)
          'https://raw.githubusercontent.com/gvcci666fire-ui/musica/refs/heads/main/Dipinto%20-%20Bandito%20(Official%20Video).mp3',
          // SECONDO BRANO - URL RAW CORRETTO (sostituisci /blob/ con /raw/)
          'https://raw.githubusercontent.com/gvcci666fire-ui/musica/main/Shiva%20-%20Bad%20Bad%20Bad%20feat.%20Geolier%20(Audio).mp3',
          // TERZO BRANO - URL RAW CORRETTO
          'https://raw.githubusercontent.com/gvcci666fire-ui/musica/main/G.Mineiro%20-%20Splinter%20Cell%20prod.%20Flat%2C%20Succo%2C%20Jiz%20(Visualizer).mp3',
          // Aggiungi altri URL se vuoi una playlist (verranno riprodotti in sequenza e poi ricominceranno)
          // 'https://raw.githubusercontent.com/tuoutente/tua-repo/main/altro-brano.mp3',
        ];
        // ▲▲▲ FINE PERSONALIZZAZIONE ▲▲▲

        if (musicUrls.length === 0) {
          console.warn('⚠️ Nessun URL musicale specificato. Il riproduttore non partirà.');
          return;
        }

        let musicIndex = 0;

        // Funzione per riprodurre la prossima traccia
        const playNextTrack = () => {
          if (isDestroyed || !player || !connection) return;
          // ✅ Fix: bisogna controllare la proprietà `.status` dello stato,
          // non confrontare l'intero oggetto `state` con il valore dell'enum.
          if (connection.state.status !== VoiceConnectionStatus.Ready) return;

          try {
            const idx = musicIndex % musicUrls.length;
            const url = musicUrls[idx];
            musicIndex++;

            const resource = createAudioResource(url, { inputType: StreamType.Arbitrary });
            player.play(resource);
            console.log(`🎵 Riproduzione: ${url.split('/').pop()}`);
          } catch (err) {
            console.error('❌ Errore nella creazione/riproduzione della traccia:', err);
            // Tentativo di recupero dopo breve delay
            if (!isDestroyed) setTimeout(playNextTrack, 5000);
          }
        };

        // 3️⃣ Gestione eventi del player
        player.on(AudioPlayerStatus.Idle, () => {
          if (!isDestroyed) {
            console.log('🎵 Traccia terminata. Avvio della successiva...');
            playNextTrack();
          }
        });

        player.on('error', (error: Error) => {
          console.error(`❌ Errore nel riproduttore audio: ${error.message}`);
          if (!isDestroyed) setTimeout(playNextTrack, 5000);
        });

        // 4️⃣ Collega player alla connessione vocale
        connection.subscribe(player);

        // 5️⃣ Avvia la prima traccia
        playNextTrack();

        // 6️⃣ Gestione eventi di riconnessione della connessione vocale
        connection.on(VoiceConnectionStatus.Disconnected, async () => {
          console.log(`⚠️ Connessione vocale disconnessa. Tentativo di riconnessione...`);
          if (!isDestroyed) {
            setTimeout(() => {
              if (!isDestroyed) startMusicPlayer().catch(console.error);
            }, 3000);
          }
        });

        connection.on(VoiceConnectionStatus.Destroyed, () => {
          console.log(`⚠️ Connessione vocale distrutta.`);
          isDestroyed = true;
        });

        // Log aggiuntivi (facoltativi ma utili per il debug)
        connection.on(VoiceConnectionStatus.Connecting, () => {
          console.log(`🔄 Connessione vocale in corso...`);
        });
        connection.on(VoiceConnectionStatus.Signalling, () => {
          console.log(`🔄 Connessione vocale in segnalingo...`);
        });
        connection.on(VoiceConnectionStatus.Ready, () => {
          console.log(`✅ Connessione vocale pronta e stabile.`);
        });
      } catch (error) {
        console.error("❌ Errore fatale nell'avvio del riproduttore musicale:", error);
        cleanup();
        // Tentativo di recupero dopo un delay più lungo
        if (!isDestroyed) setTimeout(startMusicPlayer, 10_000);
      }
    };

    // Avvio iniziale del riproduttore
    await startMusicPlayer().catch(console.error);
  } catch (error) {
    console.error('❌ Errore durante la configurazione del riproduttore vocale:', error);
  }

  // =========================================================
  // 5️⃣  INVIO MESSAGGIO UTILITY PER IL NICKNAME (Se il canale è vuoto)
  // =========================================================
  const setupChannelId = CONFIG.CHANNELS.SETUP_NICKNAME;
  const setupChannel = guild.channels.cache.get(setupChannelId) as TextChannel;

  if (setupChannel) {
    try {
      // Evitiamo di inviare il messaggio ad ogni riavvio se il canale già contiene qualcosa
      const messages = await setupChannel.messages.fetch({ limit: 10 });

      if (messages.size === 0) {
        const nickEmbed = new EmbedBuilder()
          .setTitle('⚙️ SINCRO NICKNAME • FORMATTAZIONE FONT')
          .setColor(CONFIG.COLORS.TORINO_RED)
          .setDescription('Clicca sul pulsante rosso sottostante per formattare automaticamente il tuo Nickname in questo server con il tag del tuo **Grado Staff più alto** in stile ǫᴜᴇꜱᴛᴏ ꜰᴏɴᴛ.')
          .addFields(
            {
              name: '📋 Come funziona?',
              value:
                'Il sistema analizzerà i tuoi ruoli correnti e anteporrà al tuo nome il tag stilizzato del tuo ruolo (Es: `[ꜱᴛᴀꜰꜰ] Nome`).\\nSe cambi di grado, ti basterà ricliccare il pulsante.',
            }
          )
          .setTimestamp()
          .setFooter({ text: 'Apex Italy RP • Utility Automatiche Staff' });

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
