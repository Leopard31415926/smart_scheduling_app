import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
export const ensureDbDirectory = (dbPath: string = config.DB_PATH): void => {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    try {
      fs.mkdirSync(dbDir, { recursive: true });
    } catch (err) {
      console.warn(`[Database] Could not create directory ${dbDir}:`, err);
    }
  }
};
ensureDbDirectory();

// Open SQLite database with busy_timeout and WAL mode using native Node.js DatabaseSync
export const db = new DatabaseSync(config.DB_PATH);
db.exec('PRAGMA busy_timeout = 5000;');
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA synchronous = NORMAL;');
db.exec('PRAGMA cache_size = -64000;');

// Initialize schema (search candidate locations with inline fallback for bundled serverless functions)
const candidateSchemaPaths = [
  path.resolve(__dirname, 'schema.sql'),
  path.resolve(__dirname, '../src/db/schema.sql'),
  path.resolve(__dirname, '../../server/src/db/schema.sql'),
  path.resolve(process.cwd(), 'server/src/db/schema.sql'),
  path.resolve(process.cwd(), 'server/dist/db/schema.sql'),
];

let schemaSql: string | null = null;
for (const p of candidateSchemaPaths) {
  if (fs.existsSync(p)) {
    try {
      schemaSql = fs.readFileSync(p, 'utf8');
      break;
    } catch {
      // Continue to next candidate
    }
  }
}

if (schemaSql) {
  db.exec(schemaSql);
} else {
  // Built-in DDL fallback ensuring tables exist in production serverless environments
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      name TEXT NOT NULL,
      standing TEXT NOT NULL,
      major TEXT NOT NULL,
      minor TEXT,
      intended_major TEXT,
      ge_status TEXT,
      major_requirements_taken TEXT DEFAULT '[]',
      breaks_preference TEXT DEFAULT '[]',
      preferences TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS onboarding_progress (
      user_id TEXT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
      completed BOOLEAN DEFAULT 0,
      last_step INTEGER DEFAULT 1,
      skipped_steps TEXT DEFAULT '[]',
      draft_answers TEXT DEFAULT '{}',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS oauth_tokens (
      user_id TEXT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      scope TEXT,
      expires_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS conversations (
      message_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      sender TEXT NOT NULL CHECK (sender IN ('USER', 'AGENT', 'SYSTEM')),
      content TEXT NOT NULL,
      tool_calls TEXT DEFAULT NULL,
      metadata TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_calendar_events (
      event_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      days TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      credits INTEGER DEFAULT 5,
      term TEXT NOT NULL,
      pinned BOOLEAN DEFAULT 0,
      conflict_badges TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_user_created ON conversations(user_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user_term ON user_calendar_events(user_id, term);
  `);
}

// Runtime migration safeguard: ensure preferences column exists in users table
export const runPreferencesMigration = (targetDb: any = db): void => {
  try {
    const tableInfo = targetDb.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;
    const hasPreferences = tableInfo.some((col) => col.name === 'preferences');
    if (!hasPreferences) {
      targetDb.exec("ALTER TABLE users ADD COLUMN preferences TEXT DEFAULT '{}';");
    }
  } catch (err) {
    console.error('[Database] Migration error while verifying preferences column:', err);
  }
};
runPreferencesMigration(db);

// Runtime migration safeguard: ensure user_calendar_events table and index exist
export const runCalendarEventsMigration = (targetDb: any = db): void => {
  try {
    targetDb.exec(`
      CREATE TABLE IF NOT EXISTS user_calendar_events (
        event_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        course_id TEXT NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        days TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        credits INTEGER DEFAULT 5,
        term TEXT NOT NULL,
        pinned BOOLEAN DEFAULT 0,
        conflict_badges TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user_term ON user_calendar_events(user_id, term);
    `);
  } catch (err) {
    console.error('[Database] Migration error while verifying user_calendar_events table:', err);
  }
};
runCalendarEventsMigration(db);

// Runtime migration safeguard: ensure user_settings and user_schedule tables exist
export const runUserScheduleMigration = (targetDb: any = db): void => {
  try {
    targetDb.exec(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id TEXT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
        sync_enabled BOOLEAN NOT NULL DEFAULT 1,
        is_connected_to_google BOOLEAN NOT NULL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_schedule (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        course_code TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        days TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        is_imported BOOLEAN NOT NULL DEFAULT 0,
        sync_status TEXT NOT NULL CHECK (sync_status IN ('pending', 'synced', 'failed')),
        google_event_id TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_user_schedule_user ON user_schedule(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_schedule_pending ON user_schedule(user_id, sync_status, is_imported);
    `);
  } catch (err) {
    console.error('[Database] Migration error while verifying user_schedule tables:', err);
  }
};
runUserScheduleMigration(db);

export default db;
