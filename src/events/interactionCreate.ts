import { Interaction, EmbedBuilder, GuildMember, Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, TextChannel, ForumChannel, ChannelType, Events } from 'discord.js';
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
    { id: '1521635835869401319', tag: 'ᴊʀ. ᴍᴏᴅ' }
];

function generateCaptcha() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    return { a, b, answer: a + b };
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

    // 1. GESTIONE DI LOGS E BOTTONI INATTIVITÀ
    if (interaction.isButton()) {
        const customId = interaction.customId;
        
        if (customId.startsWith('inattivita_')) {
            // DEFER per evitare timeout
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
                return interaction.editReply({ content: `❌ Impossibile modificare il tuo nickname. Verifica i privilegi del bot.` });
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
                const response = await fetch('https://api.erlc.gg/v2/server?Players=true&Queue=true', {
                    headers: {
                        'server-key': CONFIG.ERLC_API_KEY
                    }
                });

                if (!response.ok) {
                    throw new Error(`ERLC status fetch failed: ${response.status}`);
                }

                const statusData = await response.json();
                const queueCount = Array.isArray(statusData.Queue) ? statusData.Queue.length : 0;
                const players = Array.isArray(statusData.Players) ? statusData.Players.slice(0, 15).map((player: any) => `• ${player.Player}`).join('\n') : 'Nessun giocatore online';
                const joinKey = statusData.JoinKey || 'N/D';
                const joinUrl = statusData.JoinKey ? `https://join.erlc.gg/${encodeURIComponent(statusData.JoinKey)}` : 'https://erlc.gg';

                const embed = new EmbedBuilder()
                    .setTitle('📡 Stato server ER:LC')
                    .setColor(CONFIG.COLORS.INFO)
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

        if (customId.startsWith('voto_')) {
            await interaction.deferReply({ ephemeral: true });
            const parts = customId.split('_');
            const voto = parts[1];
            const message = interaction.message;
            const embed = EmbedBuilder.from(message.embeds[0]);
            const fields = message.embeds[0].fields ?? [];
            const favorevoleField = fields.find(field => field.name === '👍 Favorevoli') ?? { name: '👍 Favorevoli', value: '0', inline: true };
            const contrarioField = fields.find(field => field.name === '👎 Contrari') ?? { name: '👎 Contrari', value: '0', inline: true };
            const favorevoli = Number.parseInt((favorevoleField.value || '0').replace(/[^0-9]/g, ''), 10) || 0;
            const contrari = Number.parseInt((contrarioField.value || '0').replace(/[^0-9]/g, ''), 10) || 0;
            const nextFav = voto === 'favorevole' ? favorevoli + 1 : favorevoli;
            const nextContr = voto === 'contrario' ? contrari + 1 : contrari;
            const total = nextFav + nextContr;
            const favPct = total > 0 ? Math.round((nextFav / total) * 100) : 0;
            const contrPct = total > 0 ? Math.round((nextContr / total) * 100) : 0;
            const barFav = '🟩'.repeat(Math.max(1, Math.round(favPct / 10))) + '⬛'.repeat(10 - Math.max(1, Math.round(favPct / 10)));
            const barContr = '🟩'.repeat(Math.max(1, Math.round(contrPct / 10))) + '⬛'.repeat(10 - Math.max(1, Math.round(contrPct / 10)));
            embed.setFields(
                { name: '👍 Favorevoli', value: `${nextFav} (${favPct}%)\n${barFav}`, inline: true },
                { name: '👎 Contrari', value: `${nextContr} (${contrPct}%)\n${barContr}`, inline: true },
                { name: '📊 Totale', value: `${total} voti`, inline: false }
            );
            await message.edit({ embeds: [embed] });
            return interaction.editReply({ content: '✅ Voto registrato.' });
        }

        if (customId.startsWith('unban_')) {
            await interaction.deferReply({ ephemeral: true });
            if (!checkPermission(interaction.member, 2)) {
                return interaction.editReply({ content: '❌ Solo Admin e Gestionali possono sbannare.' });
            }

            const parts = customId.split('_');
            const targetId = parts[1];
            const robloxName = parts.slice(2).join('_');
            const targetUser = await interaction.client.users.fetch(targetId).catch(() => null);

            try {
                const erlcResponse = await fetch('https://api.policeroleplay.community/v1/server/command', {
                    method: 'POST',
                    headers: {
                        'Server-Key': CONFIG.ERLC_API_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ command: `:unban ${robloxName}` })
                });

                if (!erlcResponse.ok) {
                    throw new Error(`ERLC unban failed: ${erlcResponse.status}`);
                }
            } catch (error) {
                console.error('Errore ERLC unban:', error);
                return interaction.editReply({ content: '⚠️ Il comando ER:LC per lo sban non è andato a buon fine.' });
            }

            const doneEmbed = new EmbedBuilder()
                .setTitle('✅ Ban Concluso')
                .setColor(CONFIG.COLORS.SUCCESS)
                .setDescription(`Il ban per ${targetUser ?? robloxName} è stato rimosso.\nOra l’utente può tornare a giocare, ma è importante evitare nuove infrazioni.`)
                .setTimestamp();

            await interaction.message.edit({ embeds: [doneEmbed], components: [] });
            return interaction.editReply({ content: '✅ Ban rimosso con successo dal sistema ER:LC.' });
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