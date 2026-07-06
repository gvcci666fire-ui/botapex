import * as fs from 'fs';
import * as path from 'path';

export type WarnKind = 'user' | 'faction';

export interface StoredWarn {
    id: string;
    userId?: string;
    guildId: string;
    moderatorId: string;
    moderatorTag: string;
    reason: string;
    timestamp: string;
    channelId?: string;
    kind?: WarnKind;
    factionName?: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'warns.json');

function ensureStoreFile(): void {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2));
    }
}

function readStore(): Record<string, StoredWarn[]> {
    ensureStoreFile();

    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function writeStore(store: Record<string, StoredWarn[]>): void {
    ensureStoreFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

export function getGuildWarns(guildId: string): StoredWarn[] {
    const store = readStore();
    return store[guildId] ?? [];
}

export function getUserWarns(guildId: string, userId: string): StoredWarn[] {
    return getGuildWarns(guildId).filter(warn => warn.kind !== 'faction' && warn.userId === userId);
}

export function getFactionWarns(guildId: string): StoredWarn[] {
    return getGuildWarns(guildId).filter(warn => warn.kind === 'faction');
}

export function addWarn(guildId: string, warn: StoredWarn): StoredWarn {
    const normalizedWarn = { ...warn, kind: warn.kind ?? 'user' };
    const store = readStore();
    const guildWarns = store[guildId] ?? [];
    guildWarns.push(normalizedWarn);
    store[guildId] = guildWarns;
    writeStore(store);
    return normalizedWarn;
}

export function addFactionWarn(guildId: string, warn: StoredWarn): StoredWarn {
    return addWarn(guildId, { ...warn, kind: 'faction', userId: undefined, factionName: warn.factionName ?? 'Sconosciuta' });
}

export function removeWarn(guildId: string, userId: string, warnId: string): StoredWarn | null {
    const store = readStore();
    const guildWarns = store[guildId] ?? [];

    let index = -1;
    if (userId) {
        index = guildWarns.findIndex(warn => warn.kind !== 'faction' && warn.userId === userId && warn.id === warnId);
    }

    if (index === -1) {
        index = guildWarns.findIndex(warn => warn.id === warnId);
    }

    if (index === -1) {
        return null;
    }

    const [removed] = guildWarns.splice(index, 1);
    store[guildId] = guildWarns;
    writeStore(store);
    return removed;
}
