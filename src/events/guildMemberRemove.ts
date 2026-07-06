import { EmbedBuilder, Events, GuildMember } from 'discord.js';
import { CONFIG } from '../utils/config';

export const name = Events.GuildMemberRemove;
export const once = false;

export async function execute(member: GuildMember) {
    if (member.user.bot) return;

    const { guild } = member;
    const logChannel = guild.channels.cache.find((channel) => channel.isTextBased() && channel.name.includes('log') || channel.name.includes('arrivi'));

    const leaveEmbed = new EmbedBuilder()
        .setTitle('👋 Uscita dal server')
        .setDescription(`${member} ha lasciato il server.`)
        .addFields(
            { name: '👤 Utente', value: `${member.user.tag}`, inline: true },
            { name: '🆔 ID', value: `\`${member.id}\``, inline: true }
        )
        .setColor(CONFIG.COLORS.ERROR)
        .setTimestamp();

    if (logChannel && 'send' in logChannel) {
        try {
            await logChannel.send({ embeds: [leaveEmbed] });
        } catch (error) {
            console.error('❌ Errore nell\'invio del messaggio di uscita:', error);
        }
    }
}
