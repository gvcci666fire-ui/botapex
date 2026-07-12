import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'votazioni.db');
const db = new Database(dbPath);

// Abilita foreign keys
db.pragma('foreign_keys = ON');

// Inizializza le tabelle
export function initVotazioniDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS votazioni (
      id TEXT PRIMARY KEY,
      messaggio_id TEXT UNIQUE NOT NULL,
      canale_id TEXT NOT NULL,
      domanda TEXT NOT NULL,
      opzioni TEXT NOT NULL,
      data_creazione INTEGER NOT NULL,
      data_scadenza INTEGER NOT NULL,
      attiva INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS voti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      votazione_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      opzione TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (votazione_id) REFERENCES votazioni(id) ON DELETE CASCADE,
      UNIQUE(votazione_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS votazioni_ssu (
      id TEXT PRIMARY KEY,
      messaggio_id TEXT UNIQUE NOT NULL,
      canale_id TEXT NOT NULL,
      data_creazione INTEGER NOT NULL,
      attiva INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS voti_ssu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      votazione_ssu_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      voto TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (votazione_ssu_id) REFERENCES votazioni_ssu(id) ON DELETE CASCADE,
      UNIQUE(votazione_ssu_id, user_id)
    );
  `);
}

// ==================== SONDAGGI ====================

export function creasondaggio(
  votazioneId: string,
  messaggioId: string,
  canaleId: string,
  domanda: string,
  opzioni: string[]
) {
  const stmt = db.prepare(`
    INSERT INTO votazioni (id, messaggio_id, canale_id, domanda, opzioni, data_creazione, data_scadenza)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    votazioneId,
    messaggioId,
    canaleId,
    domanda,
    JSON.stringify(opzioni),
    Date.now(),
    Date.now() + 86400000 // 24 ore
  );
}

export function getSondaggio(votazioneId: string) {
  const stmt = db.prepare(`
    SELECT * FROM votazioni WHERE id = ?
  `);
  const result = stmt.get(votazioneId) as any;
  
  if (result) {
    result.opzioni = JSON.parse(result.opzioni);
  }
  return result;
}

export function aggiungiVoto(votazioneId: string, userId: string, opzione: string) {
  const stmt = db.prepare(`
    INSERT INTO voti (votazione_id, user_id, opzione, timestamp)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(votazione_id, user_id) DO UPDATE SET opzione = excluded.opzione, timestamp = excluded.timestamp
  `);

  stmt.run(votazioneId, userId, opzione, Date.now());
}

export function getVotiSondaggio(votazioneId: string): { [key: string]: number } {
  const stmt = db.prepare(`
    SELECT opzione, COUNT(*) as count FROM voti 
    WHERE votazione_id = ? 
    GROUP BY opzione
  `);

  const risultati = stmt.all(votazioneId) as any[];
  const voti: { [key: string]: number } = {};

  risultati.forEach(r => {
    voti[r.opzione] = r.count;
  });

  return voti;
}

export function getUtentiVotantiSondaggio(votazioneId: string): Set<string> {
  const stmt = db.prepare(`
    SELECT DISTINCT user_id FROM voti WHERE votazione_id = ?
  `);

  const risultati = stmt.all(votazioneId) as any[];
  return new Set(risultati.map(r => r.user_id));
}

export function getVotoUtenteSondaggio(votazioneId: string, userId: string): string | null {
  const stmt = db.prepare(`
    SELECT opzione FROM voti WHERE votazione_id = ? AND user_id = ?
  `);

  const result = stmt.get(votazioneId, userId) as any;
  return result ? result.opzione : null;
}

// ==================== VOTAZIONI SSU ====================

export function creaVotazioneSsu(votazioneId: string, messaggioId: string, canaleId: string) {
  const stmt = db.prepare(`
    INSERT INTO votazioni_ssu (id, messaggio_id, canale_id, data_creazione)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(votazioneId, messaggioId, canaleId, Date.now());
}

export function getVotazioneSsu(votazioneId: string) {
  const stmt = db.prepare(`
    SELECT * FROM votazioni_ssu WHERE id = ?
  `);

  return stmt.get(votazioneId);
}

export function aggiungiVotoSsu(votazioneSsuId: string, userId: string, voto: 'favorevole' | 'contrario') {
  const stmt = db.prepare(`
    INSERT INTO voti_ssu (votazione_ssu_id, user_id, voto, timestamp)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(votazione_ssu_id, user_id) DO UPDATE SET voto = excluded.voto, timestamp = excluded.timestamp
  `);

  stmt.run(votazioneSsuId, userId, voto, Date.now());
}

export function getVotiSsu(votazioneSsuId: string): {
  favorevoli: string[];
  contrari: string[];
} {
  const stmt = db.prepare(`
    SELECT user_id, voto FROM voti_ssu WHERE votazione_ssu_id = ?
  `);

  const risultati = stmt.all(votazioneSsuId) as any[];
  const favorevoli: string[] = [];
  const contrari: string[] = [];

  risultati.forEach(r => {
    if (r.voto === 'favorevole') favorevoli.push(r.user_id);
    else contrari.push(r.user_id);
  });

  return { favorevoli, contrari };
}

export function getVotoUtenteSsu(votazioneSsuId: string, userId: string): 'favorevole' | 'contrario' | null {
  const stmt = db.prepare(`
    SELECT voto FROM voti_ssu WHERE votazione_ssu_id = ? AND user_id = ?
  `);

  const result = stmt.get(votazioneSsuId, userId) as any;
  return result ? result.voto : null;
}

export function getAllVotiSsu(votazioneSsuId: string): Map<string, 'favorevole' | 'contrario'> {
  const stmt = db.prepare(`
    SELECT user_id, voto FROM voti_ssu WHERE votazione_ssu_id = ?
  `);

  const risultati = stmt.all(votazioneSsuId) as any[];
  const voti = new Map<string, 'favorevole' | 'contrario'>();

  risultati.forEach(r => {
    voti.set(r.user_id, r.voto);
  });

  return voti;
}

export default db;

