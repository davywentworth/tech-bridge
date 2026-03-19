import sqlite3wasm from 'node-sqlite3-wasm'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const { Database } = sqlite3wasm as any

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '../../data/techbridge.db')

// Use an in-memory database when running under Vitest. process.env.VITEST is set to 'true'
// by Vitest regardless of NODE_ENV, making it a reliable way to detect the test environment.
// The DB is a module-level singleton shared across all test files — call resetDb() in
// beforeAll() in each test file to ensure per-file isolation.
const isTest = process.env.VITEST === 'true'
if (!isTest) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
}

const db = isTest ? new Database() : new Database(DB_PATH)

export function initSchema(database: any) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      known_tech TEXT NOT NULL COLLATE NOCASE,
      target_tech TEXT NOT NULL COLLATE NOCASE,
      curriculum TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lessons (
      course_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (course_id, lesson_id)
    );
    CREATE TABLE IF NOT EXISTS progress (
      course_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      PRIMARY KEY (course_id, lesson_id)
    );
  `)
}

initSchema(db)

export function saveCourse(
  id: string,
  knownTech: string,
  targetTech: string,
  curriculum: object,
  database: any = db,
  createdAt = Date.now()
): void {
  database.run(
    'INSERT OR REPLACE INTO courses (id, known_tech, target_tech, curriculum, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, knownTech, targetTech, JSON.stringify(curriculum), createdAt]
  )
}

export function getCourseByTech(
  knownTech: string,
  targetTech: string,
  database: any = db
): {
  id: string
  known_tech: string
  target_tech: string
  curriculum: string
  created_at: number
} | null {
  return database.get('SELECT * FROM courses WHERE known_tech = ? AND target_tech = ? LIMIT 1', [
    knownTech,
    targetTech,
  ])
}

export function getCourse(
  id: string,
  database: any = db
): {
  id: string
  known_tech: string
  target_tech: string
  curriculum: string
  created_at: number
} | null {
  return database.get('SELECT * FROM courses WHERE id = ?', [id])
}

export function getProgress(
  courseId: string,
  database: any = db
): Array<{ lesson_id: string; completed: number; notes: string | null }> {
  return database.all('SELECT lesson_id, completed, notes FROM progress WHERE course_id = ?', [
    courseId,
  ])
}

export function saveProgress(
  courseId: string,
  lessonId: string,
  completed: boolean,
  notes?: string,
  database: any = db
): void {
  database.run(
    'INSERT OR REPLACE INTO progress (course_id, lesson_id, completed, notes) VALUES (?, ?, ?, ?)',
    [courseId, lessonId, completed ? 1 : 0, notes ?? null]
  )
}

export function saveLesson(
  courseId: string,
  lessonId: string,
  content: object,
  database: any = db
): void {
  database.run(
    'INSERT OR REPLACE INTO lessons (course_id, lesson_id, content, created_at) VALUES (?, ?, ?, ?)',
    [courseId, lessonId, JSON.stringify(content), Date.now()]
  )
}

export function getLesson(courseId: string, lessonId: string, database: any = db): object | null {
  const row = database.get('SELECT content FROM lessons WHERE course_id = ? AND lesson_id = ?', [
    courseId,
    lessonId,
  ])
  return row ? JSON.parse(row.content) : null
}

export function getAllCourses(database: any = db): Array<{
  id: string
  known_tech: string
  target_tech: string
  curriculum: string
  created_at: number
}> {
  return database.all('SELECT * FROM courses ORDER BY created_at DESC')
}

export function resetDb(database: any = db): void {
  if (!isTest) throw new Error('resetDb is only available in test environments')
  database.exec(`
    DROP TABLE IF EXISTS courses;
    DROP TABLE IF EXISTS lessons;
    DROP TABLE IF EXISTS progress;
  `)
  initSchema(database)
}

export default db
