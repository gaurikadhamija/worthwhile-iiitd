import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

// Store SQLite database file in ./data/campus_events.db
// WORTHWHILE_DB_PATH overrides the location (tests use ':memory:').
const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = process.env.WORTHWHILE_DB_PATH || path.join(DB_DIR, 'campus_events.db');
if (DB_PATH !== ':memory:' && !fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

// Enable Foreign Key constraints and WAL mode for high reliability
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
`);

export function getDb(): DatabaseSync {
  return db;
}
