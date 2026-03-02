import sqlite3wasm from 'node-sqlite3-wasm';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const { Database } = sqlite3wasm as any;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../data/techbridge.db');

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    known_tech TEXT NOT NULL,
    target_tech TEXT NOT NULL,
    curriculum TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS progress (
    course_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    PRIMARY KEY (course_id, lesson_id)
  );
`);

export function saveCourse(id: string, knownTech: string, targetTech: string, curriculum: object): void {
  db.run(
    'INSERT OR REPLACE INTO courses (id, known_tech, target_tech, curriculum, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, knownTech, targetTech, JSON.stringify(curriculum), Date.now()]
  );
}

export function getCourse(id: string): { id: string; known_tech: string; target_tech: string; curriculum: string } | undefined {
  return db.get('SELECT * FROM courses WHERE id = ?', [id]);
}

export function getProgress(courseId: string): Array<{ lesson_id: string; completed: number; notes: string | null }> {
  return db.all('SELECT lesson_id, completed, notes FROM progress WHERE course_id = ?', [courseId]);
}

export function saveProgress(courseId: string, lessonId: string, completed: boolean, notes?: string): void {
  db.run(
    'INSERT OR REPLACE INTO progress (course_id, lesson_id, completed, notes) VALUES (?, ?, ?, ?)',
    [courseId, lessonId, completed ? 1 : 0, notes ?? null]
  );
}

export default db;
