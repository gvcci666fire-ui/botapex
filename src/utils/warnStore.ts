import * as fs from 'fs';
import * as path from 'path';

export interface StoredWarn {
    id: string;
    userId?: string;
    guildId: string;
    moderatorId: string;
    moderatorTag: string;
    reason: string;
    timestamp: string;
    channelId?: string;
    kind?: 'user' | 'faction';
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
    return getGuildWarns(guildId).filter(warn => warn.userId === userId);
}

export function addWarn(guildId: string, warn: StoredWarn): StoredWarn {
    const store = readStore();
    const guildWarns = store[guildId] ?? [];
    guildWarns.push(warn);
    store[guildId] = guildWarns;
    writeStore(store);
    return warn;
}

export function removeWarn(guildId: string, userId: string, warnId: string): StoredWarn | null {
    const store = readStore();
    const guildWarns = store[guildId] ?? [];
    const index = guildWarns.findIndex(warn => warn.userId === userId && warn.id === warnId);

    if (index === -1) {
        return null;
    }

    const [removed] = guildWarns.splice(index, 1);
    store[guildId] = guildWarns;
    writeStore(store);
    return removed;
}

export function getFactionWarns(guildId: string): StoredWarn[] {
    return getGuildWarns(guildId).filter(warn => warn.kind === 'faction');
}

export function addFactionWarn(guildId: string, warn: StoredWarn): StoredWarn {
    const store = readStore();
    const guildWarns = store[guildId] ?? [];
    guildWarns.push({ ...warn, kind: 'faction' });
    store[guildId] = guildWarns;
    writeStore(store);
    return warn;
}
