import { Client, Events, ActivityType, EmbedBuilder, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState, StreamType } from '@discordjs/voice';
import { CONFIG } from '../utils/config';

export const name = Events.ClientReady;
export const once = true;

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

        const playStream = () => {
            const selectedUrl = musicUrls[musicIndex];
            musicIndex = (musicIndex + 1) % musicUrls.length;
            const resource = createAudioResource(selectedUrl, { 
                inputType: StreamType.Arbitrary,
                inlineVolume: true 
            });
            player.play(resource);
        };

        player.on(AudioPlayerStatus.Idle, () => {
            console.log('🎵 Traccia terminata. Riavvio del loop musicale...');
            playStream();
        });

        player.on('error', (error: any) => {
            console.error(`❌ Errore nel riproduttore audio: ${error.message}`);
            setTimeout(() => playStream(), 5000);
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

        console.log(`🎵 [Audio Loop] Connesso al canale vocale ${voiceChannelId} - Musica avviata!`);
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