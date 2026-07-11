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

export async function execute(client: Client) {
  console.log(`🟢 Apex Italy RP Bot è ONLINE! Autenticato come: ${client.user?.tag}`);

  client.user?.setActivity('https://discord.gg/ZPncAXjqwA', { type: ActivityType.Listening });

  const guild = client.guilds.cache.first();
  if (!guild) {
    console.log('⚠️ Impossibile trovare un server per configurare le funzioni automatiche.');
    return;
  }

  // =========================================================
  // 🎵 AVVIO RIPRODUTTORE VOCALE CONTINUO CON play-dl
  // =========================================================
  const voiceChannelId = CONFIG.CHANNELS.VOCALE_ATTESA;

  try {
    const voiceChannel = await guild.channels.fetch(voiceChannelId).catch(() => null);

    if (!voiceChannel || !('isVoiceBased' in voiceChannel) || !voiceChannel.isVoiceBased()) {
      console.error(`❌ [AUDIO CRITICO] Canale vocale ${voiceChannelId} non trovato o non valido!`);
      return;
    }

    let connection: VoiceConnection | null = null;
    let player: AudioPlayer | null = null;
    let isDestroyed = false;

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

    const startMusicPlayer = async () => {
      if (isDestroyed) return;

      try {
        cleanup();
        isDestroyed = false;

        // CONNESSIONE VOCALE
        connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
          selfDeaf: true,
          selfMute: false,
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
        console.log(`✅ [AUDIO] Connessione stabilita al canale vocale ${voiceChannelId}`);

        player = createAudioPlayer();

        // PLAYLIST - URL YOUTUBE (play-dl le gestisce automaticamente)
        const musicPlaylist = [
          'https://www.youtube.com/watch?v=LINK1', // Modifica con i tuoi YouTube links
          'https://www.youtube.com/watch?v=LINK2',
          'https://www.youtube.com/watch?v=LINK3',
        ];

        let playlistIndex = 0;
        let retryCount = 0;
        const MAX_RETRIES = 3;

        const playNextTrack = async () => {
          if (isDestroyed || !player || !connection) return;
          if (connection.state.status !== VoiceConnectionStatus.Ready) {
            console.warn('⚠️ [AUDIO] Connessione non pronta, tentativo in 2 secondi...');
            setTimeout(playNextTrack, 2000);
            return;
          }

          try {
            retryCount = 0;
            const idx = playlistIndex % musicPlaylist.length;
            const url = musicPlaylist[idx];
            playlistIndex++;

            console.log(`🎵 [AUDIO] Caricamento traccia ${idx + 1}/${musicPlaylist.length}...`);

            // play-dl esegue streaming direttamente
            const stream = await play.stream(url);
            if (!stream) throw new Error('Stream non disponibile');

            const resource = createAudioResource(stream.stream, {
              inputType: stream.type,
              inlineVolume: true,
            });

            resource.volume?.setVolume(0.5); // Volume moderato
            player.play(resource);

            console.log(`✅ [AUDIO] In riproduzione: traccia ${idx + 1}`);
          } catch (err) {
            console.error(`❌ [AUDIO] Errore nella riproduzione:`, err);
            retryCount++;

            if (retryCount < MAX_RETRIES) {
              console.log(`🔄 [AUDIO] Tentativo di recupero ${retryCount}/${MAX_RETRIES} tra 3 secondi...`);
              setTimeout(playNextTrack, 3000);
            } else {
              console.warn(`⚠️ [AUDIO] Max retry raggiunto, passaggio alla traccia successiva...`);
              playlistIndex++; // Salta a quella successiva
              setTimeout(playNextTrack, 5000);
            }
          }
        };

        // LISTENER PLAYER
        player.on(AudioPlayerStatus.Idle, () => {
          if (!isDestroyed) {
            console.log('🎵 [AUDIO] Traccia completata, avvio della successiva...');
            playNextTrack().catch(console.error);
          }
        });

        player.on('error', (error) => {
          console.error(`❌ [AUDIO] Errore player:`, error);
          if (!isDestroyed) setTimeout(() => playNextTrack().catch(console.error), 5000);
        });

        connection.subscribe(player);
        await playNextTrack(); // Prima traccia

        // LISTENER CONNESSIONE
        connection.on(VoiceConnectionStatus.Disconnected, () => {
          console.warn(`⚠️ [AUDIO] Disconnessione rilevata. Riconnessione in 5 secondi...`);
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
        console.error("❌ [AUDIO CRITICO] Errore fatale:", error);
        cleanup();
        if (!isDestroyed) {
          console.log("🔄 [AUDIO] Riavvio completo tra 15 secondi...");
          setTimeout(startMusicPlayer, 15_000);
        }
      }
    };

    await startMusicPlayer();

  } catch (error) {
    console.error('❌ [AUDIO CRITICO] Configurazione fallita:', error);
  }

  // =========================================================
  // SETUP NICKNAME
  // =========================================================
  const setupChannelId = CONFIG.CHANNELS.SETUP_NICKNAME;
  const setupChannel = guild.channels.cache.get(setupChannelId) as TextChannel;

  if (setupChannel) {
    try {
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
            .setStyle(ButtonStyle.Danger)
        );

        await setupChannel.send({ embeds: [nickEmbed], components: [row] });
        console.log(`📢 Setup nickname completato`);
      }
    } catch (error) {
      console.error("❌ Errore setup nickname:", error);
    }
  }
}
