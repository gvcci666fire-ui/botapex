import { EmbedBuilder, Events, GuildMember, TextChannel } from 'discord.js'; // Aggiunto TextChannel per TypeScript
import { CONFIG } from '../utils/config';

export const name = Events.GuildMemberRemove;
export const once = false;

export async function execute(member: GuildMember) {
    if (member.user.bot) return;

    const { guild } = member;
    
    // Prendiamo il canale direttamente tramite il suo ID specifico
    const logChannel = guild.channels.cache.get("1521636169887256626") as TextChannel | undefined;

    const leaveEmbed = new EmbedBuilder()
        .setTitle('👋 Uscita dal server')
        .setDescription(`${member} ha lasciato il server.`)
        .addFields(
            { name: '👤 Utente', value: `${member.user.tag}`, inline: true },
            { name: '🆔 ID', value: `\`${member.id}\``, inline: true }
        )
        .setColor(CONFIG.COLORS.ERROR)
        .setTimestamp();

    if (logChannel) {
        try {
            await logChannel.send({ embeds: [leaveEmbed] });
        } catch (error) {
            console.error('❌ Errore nell\'invio del messaggio di uscita:', error);
        }
    }
}