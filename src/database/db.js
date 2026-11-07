// =============================================
// Database — sql.js (pure JS SQLite, no C++ needed)
// Stores leads + full conversation history
// Persists to disk via fs read/write
// =============================================

import initSqlJs from "sql.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = path.join(__dirname, "../../data");
const DB_PATH   = path.join(DATA_DIR, "sgb_leads.db");

let db;      // sql.js Database instance
let SQL;     // sql.js module

// ── Persist to disk after every write ────────────────
function persist() {
  const data = db.export();
  writeFileSync(DB_PATH, Buffer.from(data));
}

// ── Init ─────────────────────────────────────────────
export async function initDatabase() {
  mkdirSync(DATA_DIR, { recursive: true });

  SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const fileBuffer = readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Enable WAL-like behaviour with PRAGMA
  db.run("PRAGMA journal_mode = MEMORY;");

  // ── Leads ──────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS leads (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      whatsapp_number    TEXT    NOT NULL UNIQUE,
      name               TEXT,
      place              TEXT,
      interested_product TEXT,
      language           TEXT    DEFAULT 'english',
      status             TEXT    DEFAULT 'new',
      notes              TEXT,
      created_at         TEXT    DEFAULT (datetime('now')),
      updated_at         TEXT    DEFAULT (datetime('now'))
    );
  `);

  // ── Conversations ──────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      whatsapp_number TEXT    NOT NULL,
      role            TEXT    NOT NULL,
      message         TEXT    NOT NULL,
      timestamp       TEXT    DEFAULT (datetime('now'))
    );
  `);

  // ── Bot state per user ─────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS bot_states (
      whatsapp_number TEXT PRIMARY KEY,
      stage           TEXT DEFAULT 'welcome',
      language        TEXT DEFAULT 'unknown',
      last_active     TEXT DEFAULT (datetime('now'))
    );
  `);

  persist();
  console.log("✅ Database initialised at:", DB_PATH);
}

// ── Generic query helpers ─────────────────────────────
function runQuery(sql, params = []) {
  db.run(sql, params);
  persist();
}

function getOne(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function getAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

// ── LEADS CRUD ────────────────────────────────────────

export function upsertLead({ whatsapp_number, name, place, interested_product, language, status }) {
  runQuery(`
    INSERT INTO leads (whatsapp_number, name, place, interested_product, language, status)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(whatsapp_number) DO UPDATE SET
      name               = COALESCE(?, name),
      place              = COALESCE(?, place),
      interested_product = COALESCE(?, interested_product),
      language           = COALESCE(?, language),
      status             = COALESCE(?, status),
      updated_at         = datetime('now')
  `, [
    whatsapp_number, name ?? null, place ?? null,
    interested_product ?? null, language ?? null, status ?? null,
    name ?? null, place ?? null, interested_product ?? null,
    language ?? null, status ?? null
  ]);
}

export function getLead(whatsapp_number) {
  return getOne("SELECT * FROM leads WHERE whatsapp_number = ?", [whatsapp_number]);
}

export function getAllLeads() {
  return getAll("SELECT * FROM leads ORDER BY created_at DESC");
}

export function updateLeadStatus(whatsapp_number, status) {
  runQuery(
    "UPDATE leads SET status = ?, updated_at = datetime('now') WHERE whatsapp_number = ?",
    [status, whatsapp_number]
  );
}

// ── CONVERSATIONS CRUD ────────────────────────────────

export function saveMessage(whatsapp_number, role, message) {
  // Ensure lead row exists
  runQuery(
    "INSERT OR IGNORE INTO leads (whatsapp_number) VALUES (?)",
    [whatsapp_number]
  );
  runQuery(
    "INSERT INTO conversations (whatsapp_number, role, message) VALUES (?, ?, ?)",
    [whatsapp_number, role, message]
  );
}

export function getConversationHistory(whatsapp_number, limit = 20) {
  const rows = getAll(`
    SELECT role, message, timestamp FROM conversations
    WHERE whatsapp_number = ?
    ORDER BY id DESC
    LIMIT ?
  `, [whatsapp_number, limit]);
  return rows.reverse(); // oldest → newest
}

// ── BOT STATE CRUD ────────────────────────────────────

export function getState(whatsapp_number) {
  return (
    getOne("SELECT * FROM bot_states WHERE whatsapp_number = ?", [whatsapp_number]) ||
    { stage: "welcome", language: "unknown" }
  );
}

export function setState(whatsapp_number, stage, language) {
  runQuery(`
    INSERT INTO bot_states (whatsapp_number, stage, language, last_active)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(whatsapp_number) DO UPDATE SET
      stage       = COALESCE(?, stage),
      language    = COALESCE(?, language),
      last_active = datetime('now')
  `, [whatsapp_number, stage ?? null, language ?? null, stage ?? null, language ?? null]);
}
