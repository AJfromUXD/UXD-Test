import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../data/relationships.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs');
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      title TEXT,
      category TEXT DEFAULT 'personal',
      notes TEXT,
      linkedin_url TEXT,
      avatar_initials TEXT,
      avatar_color TEXT,
      strength INTEGER DEFAULT 50,
      last_contact TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      x_pos REAL DEFAULT 0,
      y_pos REAL DEFAULT 0,
      tags TEXT DEFAULT '[]',
      metadata TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS relationships (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      type TEXT DEFAULT 'knows',
      strength INTEGER DEFAULT 50,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (source_id) REFERENCES contacts(id) ON DELETE CASCADE,
      FOREIGN KEY (target_id) REFERENCES contacts(id) ON DELETE CASCADE,
      UNIQUE(source_id, target_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      contact_ids TEXT DEFAULT '[]',
      read INTEGER DEFAULT 0,
      priority TEXT DEFAULT 'medium',
      action_label TEXT,
      action_data TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inputs (
      id TEXT PRIMARY KEY,
      raw_text TEXT NOT NULL,
      source_type TEXT DEFAULT 'manual',
      processed INTEGER DEFAULT 0,
      analysis TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}
