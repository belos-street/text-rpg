import fs from "fs";
import path from "path";
import { createRequire } from "node:module";
import type { Database } from "bun:sqlite";

/**
 * SQLite 数据层（bun:sqlite 内置，零依赖）。
 * 数据目录可通过环境变量注入（测试隔离用），默认项目根目录 data/。
 */

// bun:sqlite 必须惰性加载：构建期 page-data 收集 worker 运行在 Node 下，
// 顶层 import 会导致构建失败；运行时（bun start / bun dev）一定是 Bun，加载必然成功。
let DatabaseCtor: typeof Database | null = null;
function loadDatabase(): typeof Database {
  const cached = DatabaseCtor;
  if (cached) return cached;
  const req = createRequire(import.meta.url);
  const ctor = (req("bun:sqlite") as { Database: typeof Database }).Database;
  DatabaseCtor = ctor;
  return ctor;
}

export function dataDir(): string {
  return process.env.STORAGE_DATA_DIR || path.join(process.cwd(), "data");
}

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

let dbInstance: Database | null = null;

/**
 * 惰性单例：首次访问时建库；若为全新库且存在旧版 JSON 数据，
 * 自动执行一次性迁移（旧文件改名 .migrated 备份，不删除）。
 */
export function getDb(): Database {
  if (dbInstance) return dbInstance;
  const dir = dataDir();
  ensureDir(dir);
  const dbFile = path.join(dir, "game.db");
  const isFirstInit = !fs.existsSync(dbFile);

  const db = new (loadDatabase())(dbFile);
  db.run("PRAGMA journal_mode = WAL;");
  db.run(`
    CREATE TABLE IF NOT EXISTS saves (
      id TEXT PRIMARY KEY,
      slot INTEGER,
      player_name TEXT,
      chapter TEXT,
      day INTEGER,
      updated_at TEXT,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS conversations (
      save_id TEXT NOT NULL,
      seq INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      day INTEGER,
      chapter TEXT,
      created_at TEXT,
      PRIMARY KEY (save_id, seq)
    );
    CREATE TABLE IF NOT EXISTS global_progress (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT
    );
  `);

  if (isFirstInit) {
    try {
      migrateLegacyJson(dir, db);
    } catch (error) {
      console.error("[db] 旧版 JSON 迁移失败（可稍后手动处理）:", error);
    }
  }

  dbInstance = db;
  return db;
}

const SAVE_FILE_RE = /^[a-f0-9]{20}\.json$/;

/** 旧版 data/saves/*.json、data/conversations/*.json、data/global.json → SQLite */
function migrateLegacyJson(dir: string, db: Database) {
  // 1. 存档
  const savesDir = path.join(dir, "saves");
  if (fs.existsSync(savesDir)) {
    const insertSave = db.query(
      `INSERT OR IGNORE INTO saves (id, slot, player_name, chapter, day, updated_at, data)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const file of fs.readdirSync(savesDir)) {
      if (!SAVE_FILE_RE.test(file)) continue;
      const filePath = path.join(savesDir, file);
      try {
        const save = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        insertSave.run(
          save.id,
          save.slot ?? 1,
          save.playerName ?? "",
          save.chapter ?? "",
          save.day ?? 1,
          save.updatedAt ?? new Date().toISOString(),
          JSON.stringify(save),
        );
        fs.renameSync(filePath, `${filePath}.migrated`);
      } catch (error) {
        console.error(`[db] 旧存档 ${file} 迁移失败，保留原文件:`, error);
      }
    }
  }

  // 2. 会话
  const conversationsDir = path.join(dir, "conversations");
  if (fs.existsSync(conversationsDir)) {
    const insertMsg = db.query(
      `INSERT INTO conversations (save_id, seq, role, content, day, chapter, created_at)
       VALUES (?, (SELECT COALESCE(MAX(seq), 0) + 1 FROM conversations WHERE save_id = ?),
               ?, ?, ?, ?, ?)`,
    );
    for (const file of fs.readdirSync(conversationsDir)) {
      if (!SAVE_FILE_RE.test(file)) continue;
      const filePath = path.join(conversationsDir, file);
      try {
        const messages = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
          role: string;
          content: string;
          day?: number;
          chapter?: string;
        }[];
        db.run("BEGIN");
        for (const m of messages) {
          insertMsg.run(
            file.replace(".json", ""),
            file.replace(".json", ""),
            m.role,
            m.content,
            m.day ?? null,
            m.chapter ?? null,
            new Date().toISOString(),
          );
        }
        db.run("COMMIT");
        fs.renameSync(filePath, `${filePath}.migrated`);
      } catch (error) {
        db.run("ROLLBACK");
        console.error(`[db] 旧会话 ${file} 迁移失败，保留原文件:`, error);
      }
    }
  }

  // 3. 全局进度（结局图鉴）
  const globalPath = path.join(dir, "global.json");
  if (fs.existsSync(globalPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(globalPath, "utf-8")) as {
        unlockedEndings?: string[];
        updatedAt?: string;
      };
      const insert = db.query(
        `INSERT OR IGNORE INTO global_progress (key, value, updated_at) VALUES (?, '', ?)`,
      );
      const endings = Array.isArray(parsed.unlockedEndings)
        ? parsed.unlockedEndings
        : [];
      for (const endingId of endings) {
        insert.run(`ending:${endingId}`, parsed.updatedAt ?? "");
      }
      fs.renameSync(globalPath, `${globalPath}.migrated`);
    } catch (error) {
      console.error("[db] global.json 迁移失败，保留原文件:", error);
    }
  }
}
