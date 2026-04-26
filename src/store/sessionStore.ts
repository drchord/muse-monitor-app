import * as SQLite from 'expo-sqlite';
import { create } from 'zustand';
import type { SessionRecord } from '../types/muse';

let db: ReturnType<typeof SQLite.openDatabaseSync>;
try {
  db = SQLite.openDatabaseSync('muse_sessions.db');
  db.execSync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at    TEXT NOT NULL,
      duration_sec  INTEGER NOT NULL,
      pct_in_state  REAL NOT NULL,
      longest_run   INTEGER NOT NULL,
      protocol      TEXT NOT NULL DEFAULT 'deep_theta_delta'
    );
  `);
} catch (e) {
  console.error('SQLite init failed:', e);
}

interface SessionStoreState {
  sessions: SessionRecord[];
  loadSessions: () => void;
  saveSession:  (s: Omit<SessionRecord, 'id'>) => void;
}

export const useSessionStore = create<SessionStoreState>((set) => ({
  sessions: [],

  loadSessions: () => {
    try {
      const rows = db?.getAllSync('SELECT * FROM sessions ORDER BY id DESC LIMIT 50');
      if (!Array.isArray(rows)) { set({ sessions: [] }); return; }
      set({ sessions: rows.map((r: any) => ({
        id: r.id, startedAt: r.started_at, durationSec: r.duration_sec,
        pctInState: r.pct_in_state, longestRunSec: r.longest_run, protocol: r.protocol,
      })) });
    } catch (e) {
      console.error('loadSessions failed:', e);
      set({ sessions: [] });
    }
  },

  saveSession: (s) => {
    try {
      db?.runSync(
        'INSERT INTO sessions (started_at, duration_sec, pct_in_state, longest_run, protocol) VALUES (?, ?, ?, ?, ?)',
        [s.startedAt, s.durationSec, s.pctInState, s.longestRunSec, s.protocol]
      );
      // inline load instead of calling getState()
      const rows = db?.getAllSync('SELECT * FROM sessions ORDER BY id DESC LIMIT 50');
      if (!Array.isArray(rows)) return;
      set({ sessions: rows.map((r: any) => ({
        id: r.id, startedAt: r.started_at, durationSec: r.duration_sec,
        pctInState: r.pct_in_state, longestRunSec: r.longest_run, protocol: r.protocol,
      })) });
    } catch (e) {
      console.error('saveSession failed:', e);
    }
  },
}));
