import { Events, Message, EmbedBuilder } from 'discord.js';
import { CONFIG } from '../utils/config';
import { clearPendingCaptcha, getPendingCaptcha } from '../utils/captchaStore';

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
    if (message.author.bot || !message.channel.isDMBased()) {
        return;
    }

    const captcha = getPendingCaptcha(message.author.id);
    if (!captcha) {
        return;
    }

    if (message.content.trim().toLowerCase() === 'cancel') {
        clearPendingCaptcha(message.author.id);
        await message.reply({
            embeds: [new EmbedBuilder()
                .setTitle('⚪ Verifica annullata')
                .setDescription('La verifica è stata annullata. Se vuoi riprovare, premi nuovamente il pulsante di verifica.')
                .setColor(CONFIG.COLORS.INFO)]
        });
        return;
    }

    const answer = Number.parseInt(message.content.trim(), 10);
    if (Number.isNaN(answer)) {
        await message.reply({
            embeds: [new EmbedBuilder()
                .setTitle('⚠️ Risposta non valida')
                .setDescription('Inserisci un numero valido. Scrivi `cancel` per annullare la verifica.')
                .setColor(CONFIG.COLORS.ERROR)]
        });
        return;
    }

    if (answer !== captcha.answer) {
        clearPendingCaptcha(message.author.id);
        await message.reply({
            embeds: [new EmbedBuilder()
                .setTitle('❌ Verifica rifiutata')
                .setDescription('La risposta inserita non è corretta. La verifica non è stata completata.')
                .setColor(CONFIG.COLORS.ERROR)]
        });
        return;
    }

    const guild = message.client.guilds.cache.get(captcha.guildId);
    const member = guild?.members.cache.get(message.author.id) ?? await guild?.members.fetch(message.author.id).catch(() => null);

    if (!member) {
        clearPendingCaptcha(message.author.id);
        await message.reply('⚠️ Non riesco a trovare il tuo profilo nel server.');
        return;
    }

    try {
        const roleIds = [
            '1521635925711392948',
            '1521635922620317816',
            '1521635919143239903',
            '1521635927670132847'
        ];
        const roles = roleIds.map((roleId) => guild?.roles.cache.get(roleId) ?? null).filter(Boolean) as any[];
        await member.roles.add(roles);
        clearPendingCaptcha(message.author.id);
        await message.reply({ embeds: [new EmbedBuilder().setTitle('✅ Verifica completata').setDescription('Hai ricevuto i ruoli richiesti.').setColor(CONFIG.COLORS.SUCCESS)] });
    } catch (error) {
        console.error('Errore durante la verifica:', error);
        clearPendingCaptcha(message.author.id);
        await message.reply('⚠️ La verifica non è riuscata.');
    }
}
