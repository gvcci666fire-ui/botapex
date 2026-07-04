import { Interaction, EmbedBuilder, GuildMember, Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, TextChannel, ForumChannel, ChannelType } from 'discord.js';
import { CONFIG, checkPermission, convertToSpecialFont } from '../utils/config';

interface CommandClient extends Client {
    commands: Map<string, { execute: (interaction: any) => Promise<void> }>;
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
        if (customId === 'setup_nickname_font') {
            await interaction.deferReply({ ephemeral: true });

            const member = interaction.member as GuildMember;
            const currentName = member.displayName;
            const highestRole = member.roles.highest.name;
            const stylizedRole = convertToSpecialFont(highestRole);
            const finalNick = `[${stylizedRole}] ${currentName}`;

            if (finalNick.length > 32) {
                return interaction.editReply({ content: `❌ Il nome finale risulterebbe troppo lungo (${finalNick.length} caratteri). Riduci il tuo nome su Discord.` });
            }

            try {
                await member.setNickname(finalNick);
                return interaction.editReply({ content: `✅ Nickname formattato con successo in: \`${finalNick}\`` });
            } catch (err) {
                return interaction.editReply({ content: `❌ Impossibile modificare il tuo nickname. Verifica i privilegi del bot.` });
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
                embed.setTitle(`${currentTitle} (Accettato)`);
                embed.setColor(CONFIG.COLORS.SUCCESS);
                embed.setFields(
                    ...(message.embeds[0].fields ?? []).filter(field => field.name !== '⚖️ Stato Gestione'),
                    { name: '⚖️ Stato Gestione', value: `🟢 Accettato da ${interaction.user}`, inline: false }
                );
            } else if (action === 'rifiuta') {
                embed.setTitle(`${currentTitle} (Rifiutato)`);
                embed.setColor(CONFIG.COLORS.ERROR);
                embed.setFields(
                    ...(message.embeds[0].fields ?? []).filter(field => field.name !== '⚖️ Stato Gestione'),
                    { name: '⚖️ Stato Gestione', value: `🔴 Rifiutato da ${interaction.user}`, inline: false }
                );
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
                return interaction.editReply({ content: '❌ Solo Admin e Gestionali possono sbanare.' });
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
                    .setTitle('💡 PROPOSTA DI MIGLIORAMENTO')
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
                    name: `Consiglio (In Attesa) [${interaction.user.username}]`,
                    message: { embeds: [consiglioEmbed], components: [row] }
                });

                return interaction.editReply({ content: '✅ Il tuo consiglio è stato pubblicato nel forum dedicato!' });
            }
        }
    }
}