import * as SQLite from 'expo-sqlite';
import { create } from 'zustand';
import type { SessionRecord } from '../types/muse';

const db = SQLite.openDatabaseSync('muse_sessions.db');

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

interface SessionStoreState {
  sessions: SessionRecord[];
  loadSessions: () => void;
  saveSession:  (s: Omit<SessionRecord, 'id'>) => void;
}

export const useSessionStore = create<SessionStoreState>((set) => ({
  sessions: [],

  loadSessions: () => {
    const rows = db.getAllSync('SELECT * FROM sessions ORDER BY id DESC LIMIT 50') as any[];
    set({ sessions: rows.map(r => ({
      id: r.id, startedAt: r.started_at, durationSec: r.duration_sec,
      pctInState: r.pct_in_state, longestRunSec: r.longest_run, protocol: r.protocol
    })) });
  },

  saveSession: (s) => {
    db.runSync(
      'INSERT INTO sessions (started_at, duration_sec, pct_in_state, longest_run, protocol) VALUES (?, ?, ?, ?, ?)',
      [s.startedAt, s.durationSec, s.pctInState, s.longestRunSec, s.protocol]
    );
    useSessionStore.getState().loadSessions();
  },
}));
