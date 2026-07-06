interface PendingCaptcha {
    guildId: string;
    memberId: string;
    answer: number;
    expiresAt: number;
}

const pendingCaptchas = new Map<string, PendingCaptcha>();

export function setPendingCaptcha(memberId: string, captcha: PendingCaptcha): void {
    pendingCaptchas.set(memberId, captcha);
}

export function getPendingCaptcha(memberId: string): PendingCaptcha | undefined {
    const captcha = pendingCaptchas.get(memberId);
    if (!captcha) {
        return undefined;
    }

    if (Date.now() > captcha.expiresAt) {
        pendingCaptchas.delete(memberId);
        return undefined;
    }

    return captcha;
}

export function clearPendingCaptcha(memberId: string): void {
    pendingCaptchas.delete(memberId);
}
