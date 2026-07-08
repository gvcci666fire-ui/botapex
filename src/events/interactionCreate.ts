import { Interaction, EmbedBuilder, GuildMember, Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, TextChannel, ForumChannel, ChannelType, Events, ButtonInteraction, MessageFlags } from 'discord.js';
import { CONFIG, checkPermission, convertToSpecialFont } from '../utils/config';
import { clearPendingCaptcha, getPendingCaptcha, setPendingCaptcha } from '../utils/captchaStore';

export const name = Events.InteractionCreate;
export const once = false;

interface CommandClient extends Client {
    commands: Map<string, { execute: (interaction: any) => Promise<void> }>;
}

const ROLES_LIST = [
    { id: '1521635810300923925', tag: 'ꜰᴏᴜɴᴅᴇʀ' },
    { id: '1521635811806674984', tag: 'ᴄᴏ-ꜰᴏᴜɴᴅᴇʀ' },
    { id: '1521635812775563354', tag: 'ᴏᴡɴᴇʀ' },
    { id: '1521635813337731115', tag: 'ᴄᴏ-ᴏᴡɴᴇʀ' },
    { id: '1521635819344105674', tag: 'ꜱᴇʀᴠ. ᴍᴀɴᴀɢᴇʀ', textTag: 'ꜱᴇʀᴠ. ᴍᴀɴᴀɢᴇʀ' },
    { id: '1521635820254003271', tag: 'ꜱᴇʀᴠ. ᴄᴏ-ᴍᴀɴᴀɢᴇʀ' },
    { id: '1521635822372393071', tag: 'ᴄ. ᴍᴀɴᴀɢᴇᴍᴇɴᴛ' },
    { id: '1521635823160656127', tag: 'ꜱ. ᴍᴀɴᴀɢᴇᴍᴇɴᴛ' },
    { id: '1521635824406368267', tag: 'ꜱᴜᴘᴇʀᴠɪꜱᴏʀ' },
    { id: '1521635826981670963', tag: 'ʜᴇᴀᴅ ᴀᴅᴍɪɴ' },
    { id: '1521635828525170808', tag: '<b>ꜱʀ. ᴀᴅᴍɪɴ</b>', textTag: '<b>ꜱʀ. ᴀᴅᴍɪɴ</b>' },
    { id: '1521635829704036552', tag: 'ᴀᴅᴍɪɴ' },
    { id: '1521635830819455086', tag: 'ᴊʀ. ᴀᴅᴍɪɴ' },
    { id: '1521635832614617168', tag: 'ʜᴇᴀᴅ ᴍᴏᴅ' },
    { id: '1521635833717981254', tag: '<b>ꜱʀ. ᴍᴏᴅ</b>', textTag: '<b>ꜱʀ. ᴍᴏᴅ</b>' },
    { id: '1521635834535612517', tag: 'ᴍᴏᴅ' },
    { id: '1521635834535612517', tag: 'ᴍᴏᴅ' },
    { id: '1521635835869401319', tag: 'ᴊʀ. ᴍᴏᴅ' }
];

const SOGLIA = 6;
// Mappa globale per persistere i voti tra le interazioni nello stesso ciclo vitale del bot
const votiSSU = new Map<string, 'favorevole' | 'contrario'>();

function generateCaptcha() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    return { a, b, answer: a + b };
}

async function fetchErlcServerStatus() {
    const response = await fetch('https://api.erlc.gg/v2/server?Players=true&Queue=true', {
        headers: {
            'server-key': CONFIG.ERLC_API_KEY,
            'Accept': 'application/json',
            'User-Agent': 'ApexItalyRP-Bot/1.0'
        }
    });

    if (!response.ok) {
        let errorBody = '';
        try { errorBody = await response.text(); } catch {}
        throw new Error(`ERLC status fetch failed: ${response.status}${errorBody ? ` - ${errorBody}` : ''}`);
    }

    const payload = await response.text();
    if (!payload) throw new Error('ERLC response was empty');

    try {
        return JSON.parse(payload);
    } catch {
        return { raw: payload };
    }
}

export async function handleInteraction(interaction: Interaction) {
    if (interaction.isChatInputCommand()) {
        const client = interaction.client as CommandClient;
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            return interaction.reply({ content: '❌ Questo comando non è disponibile al momento.', ephemeral: true });
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Errore esecuzione comando /${interaction.commandName}:`, error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: '⚠️ Si è verificato un errore durante l’esecuzione del comando.', ephemeral: true });
            } else {
                await interaction.reply({ content: '⚠️ Si è verificato un errore durante l’esecuzione del comando.', ephemeral: true });
            }
        }
        return;
    }

    if (interaction.isButton()) {
        const customId = interaction.customId;
        
        // 1. GESTIONE DI LOGS E BOTTONI INATTIVITÀ
        if (customId.startsWith('inattivita_')) {
            await interaction.deferReply({ ephemeral: true });

            if (!checkPermission(interaction.member, 2)) {
                return interaction.editReply({ content: "❌ Solo gli Amministratori o i membri Gestionali possono valutare le inattività." });
            }

            const parti = customId.split('_');
            const azione = parti[1];
            const utenteId = parti[2];
            
            const targetUser = await interaction.client.users.fetch(utenteId);
            const originalEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

            if (azione === 'accetta') {
                originalEmbed.setColor(CONFIG.COLORS.SUCCESS);
                originalEmbed.setFields(
                    ...interaction.message.embeds[0].fields.filter(f => f.name !== '⚖️ Stato Richiesta'),
                    { name: '⚖️ Stato Richiesta', value: `🟢 **ACCETTATA da ${interaction.user}**`, inline: false }
                );

                const targetMember = await interaction.guild?.members.fetch(utenteId);
                if (targetMember) await targetMember.roles.add(CONFIG.ROLES.INATTIVO);

                try { await targetUser.send({ content: `🟢 La tua richiesta di inattività su **Apex Italy RP** è stata **Accettata**.` }); } catch {}
            } else {
                originalEmbed.setColor(CONFIG.COLORS.ERROR);
                originalEmbed.setFields(
                    ...interaction.message.embeds[0].fields.filter(f => f.name !== '⚖️ Stato Richiesta'),
                    { name: '⚖️ Stato Richiesta', value: `🔴 **RIFIUTATA da ${interaction.user}**`, inline: false }
                );

                try { await targetUser.send({ content: `🔴 La tua richiesta di inattività su **Apex Italy RP** è stata **Rifiutata**.` }); } catch {}
            }

            await interaction.message.edit({ embeds: [originalEmbed], components: [] });
            return interaction.editReply({ content: "✅ Azione completata con successo." });
        }

        // 2. CAMBIO NICKNAME CON FONT AUTOMATICO
        if (customId === 'setup_nickname_font' || customId === 'btn_setup_nickname') {
            await interaction.deferReply({ ephemeral: true });

            const member = interaction.member as GuildMember;
            const matchedRole = ROLES_LIST.find(role => member.roles.cache.has(role.id));

            if (!matchedRole) {
                return interaction.editReply({ content: '❌ Non fai parte dello staff, quindi non posso impostare il tuo tag nickname.' });
            }

            const tag = matchedRole.textTag ?? matchedRole.tag;
            const currentName = member.displayName.replace(/^\[[^\]]+\]\s*/, '');
            const baseName = currentName || member.user.username;
            const finalNick = `[${tag}] ${baseName}`;

            if (finalNick.length > 32) {
                return interaction.editReply({ content: `❌ Il nome finale risulterebbe troppo lungo (${finalNick.length} caratteri). Riduci il tuo nome su Discord.` });
            }

            try {
                await member.setNickname(finalNick);
                return interaction.editReply({ content: `✅ Nickname aggiornato con successo in: \`${finalNick}\`` });
            } catch (err) {
                return interaction.editReply({ content: `❌ Impossibile modificare il tuo nickname. Verifica i privileges del bot.` });
            }
        }

        if (customId.startsWith('role_toggle_')) {
            await interaction.deferReply({ ephemeral: true });
            const roleId = customId.replace('role_toggle_', '');
            const member = interaction.member;

            if (!member || !('roles' in member)) {
                return interaction.editReply({ content: '⚠️ Impossibile gestire i ruoli in questa interazione.' });
            }

            const guildMember = member as GuildMember;
            const role = interaction.guild?.roles.cache.get(roleId) ?? await interaction.guild?.roles.fetch(roleId).catch(() => null);
            if (!role) {
                return interaction.editReply({ content: '⚠️ Il ruolo richiesto non è disponibile.' });
            }

            const hasRole = guildMember.roles.cache.has(role.id);
            try {
                if (hasRole) {
                    await guildMember.roles.remove(role);
                    return interaction.editReply({ content: `✅ Hai rimosso il ruolo ${role.name}.` });
                }

                await guildMember.roles.add(role);
                return interaction.editReply({ content: `✅ Hai ottenuto il ruolo ${role.name}.` });
            } catch (error) {
                console.error('Errore nel toggle del ruolo:', error);
                return interaction.editReply({ content: '⚠️ Non è stato possibile aggiornare il tuo ruolo.' });
            }
        }

        if (customId === 'verify_member' || customId.startsWith('verify_member_')) {
            await interaction.deferReply({ ephemeral: true });
            const targetMemberId = customId === 'verify_member' ? interaction.user.id : customId.replace('verify_member_', '');
            const member = await interaction.guild?.members.fetch(targetMemberId).catch(() => null);

            if (!member) {
                return interaction.editReply({ content: '⚠️ Impossibile trovare l\'utente da verificare.' });
            }

            const captcha = generateCaptcha();
            setPendingCaptcha(member.id, {
                guildId: interaction.guildId ?? '',
                memberId: member.id,
                answer: captcha.answer,
                expiresAt: Date.now() + 2 * 60 * 1000
            });

            await interaction.editReply({ content: '📩 Ti ho inviato un captcha privato. Rispondi per completare la verifica.'});
            await member.send({
                embeds: [new EmbedBuilder()
                    .setTitle('🧩 Verifica captcha')
                    .setDescription('Rispondi con il risultato del calcolo per completare la verifica.')
                    .addFields({ name: 'Domanda', value: `Quanto fa ${captcha.a} + ${captcha.b}?` })
                    .setColor(CONFIG.COLORS.SUCCESS)
                    .setFooter({ text: 'Hai 2 minuti per rispondere. Scrivi cancel per annullare.' })]
            }).catch(() => undefined);
            return;
        }

        if (customId === 'info_status_refresh') {
            if (!checkPermission(interaction.member, 2)) {
                return interaction.reply({ content: '❌ Solo lo staff amministrativo può aggiornare questo status.', ephemeral: true });
            }

            await interaction.deferUpdate();

            try {
                const statusData = await fetchErlcServerStatus();
                const queueCount = Array.isArray(statusData.Queue) ? statusData.Queue.length : 0;
                const players = Array.isArray(statusData.Players) && statusData.Players.length > 0
                    ? statusData.Players.slice(0, 15).map((player: any) => `• ${player.Player ?? player.Name ?? player.username ?? 'Giocatore'}`).join('\n')
                    : 'Nessun giocatore online';
                const joinKey = typeof statusData.JoinKey === 'string' && statusData.JoinKey.trim() ? statusData.JoinKey.trim() : 'N/D';
                const joinUrl = joinKey !== 'N/D' ? `https://join.erlc.gg/${encodeURIComponent(joinKey)}` : 'https://erlc.gg';

                const embed = new EmbedBuilder()
                    .setTitle('📡 Stato server ER:LC')
                    .setColor(CONFIG.COLORS.INFO)
                    .setDescription(statusData.Description ? `${statusData.Description}` : undefined)
                    .addFields(
                        { name: 'Nome server', value: `${statusData.Name ?? 'N/D'}`, inline: true },
                        { name: 'Codice per entrare', value: `\`${joinKey}\``, inline: true },
                        { name: 'Giocatori', value: `${statusData.CurrentPlayers ?? 0}/${statusData.MaxPlayers ?? 0}`, inline: true },
                        { name: 'In coda', value: `${queueCount}`, inline: true },
                        { name: 'Giocatori in gioco', value: players, inline: false }
                    )
                    .setTimestamp();

                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setLabel('Entra')
                        .setStyle(ButtonStyle.Link)
                        .setURL(joinUrl),
                    new ButtonBuilder()
                        .setCustomId('info_status_refresh')
                        .setLabel('Aggiorna')
                        .setStyle(ButtonStyle.Secondary)
                );

                return await interaction.update({ embeds: [embed], components: [row] });
            } catch (error) {
                console.error('Errore aggiornamento info-status:', error);
                return await interaction.followUp({ content: '⚠️ Impossibile aggiornare lo status del server ER:LC in questo momento.', ephemeral: true });
            }
        }

        if (customId.startsWith('consiglio_')) {
            await interaction.deferReply({ ephemeral: true });
            const parts = customId.split('_');
            const action = parts[1];
            const postId = parts[2];
            const message = interaction.message;
            const embed = EmbedBuilder.from(message.embeds[0]);
            const currentTitle = embed.data.title ?? '';
            const isAccepted = currentTitle.includes('(Accettato)') || currentTitle.includes('(Rifiutato)');
            if (isAccepted) {
                return interaction.editReply({ content: '⚠️ Questa proposta è già stata gestita.' });
            }

            if (action === 'accetta') {
                embed.setTitle(`${currentTitle} - Accettata 🟢`);
                embed.setColor(CONFIG.COLORS.SUCCESS);
                embed.setFields(
                    ...(message.embeds[0].fields ?? []).filter(field => field.name !== '⚖️ Stato Gestione'),
                    { name: '⚖️ Stato Gestione', value: `🟢 Accettato da ${interaction.user}`, inline: false }
                );

                if (interaction.channel?.isThread()) {
                    await interaction.channel.setAppliedTags(['1521636209926082633']);
                }
            } else if (action === 'rifiuta') {
                embed.setTitle(`${currentTitle} - Rifiutata 🔴`);
                embed.setColor(CONFIG.COLORS.ERROR);
                embed.setFields(
                    ...(message.embeds[0].fields ?? []).filter(field => field.name !== '⚖️ Stato Gestione'),
                    { name: '⚖️ Stato Gestione', value: `🔴 Rifiutato da ${interaction.user}`, inline: false }
                );

                if (interaction.channel?.isThread()) {
                    await interaction.channel.setAppliedTags(['1521636209926082634']);
                }
            }

            await message.edit({ embeds: [embed], components: [] });
            return interaction.editReply({ content: '✅ Gestione proposta aggiornata.' });
        }

        // 3. NUOVA LOGICA DI VOTAZIONE SSU (COLLEGATA AL TUO SISTEMA AD EMBED SEPARATI)
        if (customId.startsWith('voto_')) {
            const btnInteraction = interaction as ButtonInteraction;
            const userId = btnInteraction.user.id;
            
            const vecchioVoto = votiSSU.get(userId);
            const nuovoVoto = customId === 'voto_favorevole' ? 'favorevole' : 'contrario';

            if (vecchioVoto === nuovoVoto) {
                return void await btnInteraction.reply({
                    content: `❌ Hai già espresso un voto ${nuovoVoto === 'favorevole' ? 'favorevole' : 'contrario'}. Se desideri cambiare la tua preferenza, clicca sull'altro pulsante.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const cambio = vecchioVoto !== undefined && vecchioVoto !== nuovoVoto;
            votiSSU.set(userId, nuovoVoto);

            // Generatore di array dinamico a 2 Embed per la Votazione
            const getFavorevoli = () => [...votiSSU.entries()].filter(([_, v]) => v === 'favorevole').map(([id]) => id);
            const getContrari = () => [...votiSSU.entries()].filter(([_, v]) => v === 'contrario').map(([id]) => id);

            const favorevoli = getFavorevoli();
            const contrari = getContrari();
            const pieni = Math.min(favorevoli.length, SOGLIA);
            const vuoti = SOGLIA - pieni;
            
            const barraProgresso = '🟩'.repeat(pieni) + '⬛'.repeat(vuoti);
            const elencoFavorevoli = favorevoli.length > 0 ? favorevoli.map(id => `• <@${id}>`).join('\n') : '*Nessuna presenza registrata*';
            const sogliaRaggiunta = favorevoli.length >= SOGLIA;

            const descrizioneStato = sogliaRaggiunta 
                ? `🎉 **Il quorum minimo di ${SOGLIA} utenti favorevoli è stato soddisfatto!**\n\nLe procedure di inizializzazione del server sono iniziate, attendere lo staffer.`
                : `⚖️ **Lo staff è pronto per aprire le porte!**\nMa prima di ciò abbiamo bisogno anche di voi, alla soglia di 6 voti sarà possibile l'apertura!.\nEsprimi la tua preferenza tramite i moduli interattivi sottostanti.`;

            const coloreEmbed = sogliaRaggiunta ? '#10b981' : '#2463eb';
            const titoloEmbed = sogliaRaggiunta ? '⚡ Soglia Raggiunta! • Il server è pronto!' : '📊 Votazione SSU • Apex Italy RP';

            // Vecchia nota presente nel layout
            const vecchiaNotaField = btnInteraction.message.embeds[0]?.fields?.find(f => f.name.includes('Nota dallo Staff'));
            const notaTesto = vecchiaNotaField ? vecchiaNotaField.value : `\`\`\`fix\nIl divertimento è la priorità, ma il realismo è la nostra regola d'oro.\n\`\`\``;

            const embedPrincipale = new EmbedBuilder()
                .setTitle(titoloEmbed)
                .setDescription(descrizioneStato)
                .setColor(coloreEmbed)
                .addFields(
                    { name: '┃ 📈 Progresso Votazione', value: `\`\`\`📊 ${barraProgresso} ( ${favorevoli.length} / ${SOGLIA} Voti )\`\`\``, inline: false },
                    { name: '┃ 🗳️ Tabella di Pro e Contro', value: `> 🟩 Favorevoli: **${favorevoli.length}**\n> 🟥 Contrari: **${contrari.length}**\n> 👥 Partecipanti: **${votiSSU.size}**`, inline: false },
                    { name: '┃ ⚠️ Nota dallo Staff di Apex Italy RP', value: notaTesto, inline: false }
                )
                .setFooter({ text: 'Votazione SSU • Apex Italy RP', iconURL: btnInteraction.guild?.iconURL() || undefined })
                .setTimestamp();

            const embedListaFavorevoli = new EmbedBuilder()
                .setTitle('┃ 🟢 Utenti Favorevoli all\'Apertura')
                .setDescription(elencoFavorevoli)
                .setColor(coloreEmbed);

            const rigaPulsanti = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('voto_favorevole').setLabel(`Approva (${favorevoli.length})`).setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('voto_contrario').setLabel(`Disapprova (${contrari.length})`).setStyle(ButtonStyle.Danger)
            );

            // Aggiorna la votazione sul canale pubblico a 2 embed
            await btnInteraction.update({
                embeds: [embedPrincipale, embedListaFavorevoli],
                components: [rigaPulsanti]
            });

            // Invio log dello staff nel formato yaml corretto (senza errori binari)
            const canaleLog = btnInteraction.client.channels.cache.get(CONFIG.CHANNELS.LOGS_VOTAZIONI) as TextChannel;
            if (canaleLog && typeof canaleLog.send === 'function') {
                try {
                    const tipoTesto = nuovoVoto === 'favorevole' ? '🟢 APPROVAZIONE' : '🔴 DISAPPROVAZIONE';
                    const coloreLog = nuovoVoto === 'favorevole' ? '#10b981' : '#ef4444';
                    
                    const logEmbed = new EmbedBuilder()
                        .setTitle('⚖️ LOGS • Sistema Votazioni SSU')
                        .setDescription(`• **Operatore:** <@${userId}> (\`${userId}\`)\n• **Azione:** Ha espresso voto di **${tipoTesto}**\n• **Variazione:** ${cambio ? '🔄 Sì (Ha modificato un voto precedente)' : '🆕 No (Primo inserimento)'}`)
                        .setColor(coloreLog)
                        .addFields({
                            name: '📋 Rendimento Voti Totali',
                            value: `\`\`\`yaml\nFavorevoli: ${favorevoli.length}\nContrari: ${contrari.length}\nTotali: ${votiSSU.size}\n\`\`\``,
                            inline: false
                        })
                        .setFooter({ text: 'Registro Logs Staff • Apex Italy RP', iconURL: btnInteraction.guild?.iconURL() || undefined })
                        .setTimestamp();

                    await canaleLog.send({ embeds: [logEmbed] });
                } catch (e) {
                    console.error('Errore durante la scrittura del Log Votazione:', e);
                }
            }
            return;
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_consiglio') {
            await interaction.deferReply({ ephemeral: true });

            const consiglio = interaction.fields.getTextInputValue('consiglio_testo');
            const motivo = interaction.fields.getTextInputValue('consiglio_motivo');
            
            const forumChannel = interaction.guild?.channels.cache.get(CONFIG.CHANNELS.FORUM_CONSIGLI) as any;
            
            if (forumChannel) {
                const consiglioEmbed = new EmbedBuilder()
                    .setTitle(`💡 Consiglio - [${interaction.user.username}]`)
                    .setColor(CONFIG.COLORS.INFO)
                    .setDescription(`**Consiglio:** ${consiglio}\n\n**Perché aggiungerlo:** ${motivo}`)
                    .addFields(
                        { name: '👤 Autore', value: `${interaction.user}` },
                        { name: '⚖️ Stato Gestione', value: '⏳ In attesa di valutazione', inline: false }
                    )
                    .setTimestamp();

                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId(`consiglio_accetta_${interaction.user.id}`).setLabel('Accetta').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(`consiglio_rifiuta_${interaction.user.id}`).setLabel('Rifiuta').setStyle(ButtonStyle.Danger)
                );

                await forumChannel.threads.create({
                    name: `Consiglio - [${interaction.user.username}]`,
                    message: { embeds: [consiglioEmbed], components: [row] },
                    appliedTags: ['1521636209926082635']
                });

                return interaction.editReply({ content: '✅ Il tuo consiglio è stato pubblicato nel forum dedicato!' });
            }
        }
    }
}