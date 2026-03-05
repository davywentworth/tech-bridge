import { describe, it, expect, beforeEach } from 'vitest';
import sqlite3wasm from 'node-sqlite3-wasm';
import { initSchema, saveCourse, getCourse, saveProgress, getProgress } from './db.js';

const { Database } = sqlite3wasm as any;

function createTestDb() {
  const db = new Database();
  initSchema(db);
  return db;
}

describe('initSchema', () => {
  let db: any;

  beforeEach(() => {
    db = new Database();
    initSchema(db);
  });

  it('creates the courses and progress tables on a fresh database', () => {
    const tables = db.all(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`);
    expect(tables.map((t: any) => t.name)).toEqual(['courses', 'progress']);
  });

  it('is safe to call twice on the same database (idempotent)', () => {
    expect(() => initSchema(db)).not.toThrow();
    const tables = db.all(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`);
    expect(tables.map((t: any) => t.name)).toEqual(['courses', 'progress']);
  });

  it('creates the courses table with the correct columns', () => {
    const cols = db.all(`PRAGMA table_info(courses)`).map((c: any) => c.name);
    expect(cols).toEqual(['id', 'known_tech', 'target_tech', 'curriculum', 'created_at']);
  });

  it('creates the progress table with the correct columns', () => {
    const cols = db.all(`PRAGMA table_info(progress)`).map((c: any) => c.name);
    expect(cols).toEqual(['course_id', 'lesson_id', 'completed', 'notes']);
  });

  it('defaults the completed column to 0 when not provided', () => {
    db.run(`INSERT INTO progress (course_id, lesson_id) VALUES (?, ?)`, ['c1', 'l1']);
    const row = db.get(`SELECT completed FROM progress WHERE course_id = 'c1'`);
    expect(row.completed).toBe(0);
  });

  it('enforces the composite primary key on progress — duplicate course_id + lesson_id throws', () => {
    db.run(`INSERT INTO progress (course_id, lesson_id) VALUES (?, ?)`, ['c1', 'l1']);
    expect(() =>
      db.run(`INSERT INTO progress (course_id, lesson_id) VALUES (?, ?)`, ['c1', 'l1'])
    ).toThrow();
  });

  it('enforces NOT NULL on courses.known_tech', () => {
    expect(() => db.run(`INSERT INTO courses (id, known_tech, target_tech, curriculum, created_at) VALUES ('x', NULL, 'B', '{}', 0)`)).toThrow();
  });

  it('enforces NOT NULL on courses.target_tech', () => {
    expect(() => db.run(`INSERT INTO courses (id, known_tech, target_tech, curriculum, created_at) VALUES ('x', 'A', NULL, '{}', 0)`)).toThrow();
  });

  it('enforces NOT NULL on courses.curriculum', () => {
    expect(() => db.run(`INSERT INTO courses (id, known_tech, target_tech, curriculum, created_at) VALUES ('x', 'A', 'B', NULL, 0)`)).toThrow();
  });

  it('enforces NOT NULL on courses.created_at', () => {
    expect(() => db.run(`INSERT INTO courses (id, known_tech, target_tech, curriculum, created_at) VALUES ('x', 'A', 'B', '{}', NULL)`)).toThrow();
  });

  it('enforces NOT NULL on progress.completed when explicitly set to NULL', () => {
    expect(() => db.run(`INSERT INTO progress (course_id, lesson_id, completed) VALUES ('c1', 'l1', NULL)`)).toThrow();
  });

  it('enforces the PRIMARY KEY on courses.id — duplicate id throws', () => {
    db.run(`INSERT INTO courses (id, known_tech, target_tech, curriculum, created_at) VALUES ('x', 'A', 'B', '{}', 0)`);
    expect(() =>
      db.run(`INSERT INTO courses (id, known_tech, target_tech, curriculum, created_at) VALUES ('x', 'C', 'D', '{}', 1)`)
    ).toThrow();
  });

  it('enforces NOT NULL on progress.course_id', () => {
    expect(() => db.run(`INSERT INTO progress (course_id, lesson_id) VALUES (NULL, 'l1')`)).toThrow();
  });

  it('enforces NOT NULL on progress.lesson_id', () => {
    expect(() => db.run(`INSERT INTO progress (course_id, lesson_id) VALUES ('c1', NULL)`)).toThrow();
  });
});

describe('saveCourse and getCourse', () => {
  let db: any;

  beforeEach(() => {
    db = createTestDb();
  });

  it('saves a course and retrieves all fields by id', () => {
    const curriculum = { modules: [] };
    const before = Date.now();
    saveCourse('course-1', 'Redux', 'Redux Toolkit', curriculum, db);
    const after = Date.now();
    const row = getCourse('course-1', db);
    expect(row).not.toBeNull();
    expect(row!.id).toBe('course-1');
    expect(row!.known_tech).toBe('Redux');
    expect(row!.target_tech).toBe('Redux Toolkit');
    expect(typeof row!.curriculum).toBe('string');
    expect(JSON.parse(row!.curriculum)).toEqual(curriculum);
    expect(typeof row!.created_at).toBe('number');
    expect(row!.created_at).toBeGreaterThanOrEqual(before);
    expect(row!.created_at).toBeLessThanOrEqual(after);
  });

  it('stores curriculum as a raw JSON string, not a parsed object', () => {
    const curriculum = { modules: ['a'] };
    saveCourse('course-raw', 'A', 'B', curriculum, db);
    const row = getCourse('course-raw', db);
    expect(row!.curriculum).toBe(JSON.stringify(curriculum));
  });

  it('serializes complex curriculum objects including nested structures', () => {
    const curriculum = { modules: [{ id: 'm1', title: 'Intro', lessons: [{ id: 'l1' }] }] };
    saveCourse('course-2', 'REST', 'GraphQL', curriculum, db);
    const row = getCourse('course-2', db);
    expect(JSON.parse(row!.curriculum)).toEqual(curriculum);
  });

  it('serializes curriculum values containing special characters and unicode', () => {
    const curriculum = { title: `It's a "test" — with unicode: 日本語` };
    saveCourse('course-3', 'A', 'B', curriculum, db);
    const row = getCourse('course-3', db);
    expect(JSON.parse(row!.curriculum)).toEqual(curriculum);
  });

  it('serializes null passed as curriculum to the string "null"', () => {
    saveCourse('course-null-curriculum', 'A', 'B', null as any, db);
    const row = getCourse('course-null-curriculum', db);
    expect(row!.curriculum).toBe('null');
  });

  it('returns null when the course does not exist', () => {
    const row = getCourse('nonexistent', db);
    expect(row).toBeNull();
  });

  it('returns only the columns id, known_tech, target_tech, curriculum, and created_at', () => {
    saveCourse('course-cols', 'A', 'B', {}, db);
    const row = getCourse('course-cols', db);
    expect(Object.keys(row!).sort()).toEqual(['created_at', 'curriculum', 'id', 'known_tech', 'target_tech']);
  });

  it('returns the correct course when multiple courses exist', () => {
    saveCourse('course-a', 'React', 'Vue', {}, db);
    saveCourse('course-b', 'Redux', 'Zustand', {}, db);
    const row = getCourse('course-a', db);
    expect(row!.id).toBe('course-a');
    expect(row!.known_tech).toBe('React');
  });

  it('accepts empty strings for knownTech and targetTech', () => {
    saveCourse('course-empty', '', '', {}, db);
    const row = getCourse('course-empty', db);
    expect(row!.known_tech).toBe('');
    expect(row!.target_tech).toBe('');
  });

  it('accepts an empty string as a course id', () => {
    saveCourse('', 'A', 'B', {}, db);
    const row = getCourse('', db);
    expect(row).not.toBeNull();
    expect(row!.id).toBe('');
  });

  it('overwrites an existing course when saved with the same id, leaving only one row with a fresh created_at', () => {
    saveCourse('course-4', 'React', 'Vue', { modules: [] }, db);
    const firstRow = getCourse('course-4', db);

    const beforeUpdate = Date.now();
    saveCourse('course-4', 'React', 'Svelte', { modules: [{ id: 'm1' }] }, db);
    const afterUpdate = Date.now();

    const row = getCourse('course-4', db);
    expect(row!.target_tech).toBe('Svelte');
    expect(JSON.parse(row!.curriculum)).toEqual({ modules: [{ id: 'm1' }] });
    expect(row!.created_at).toBeGreaterThanOrEqual(beforeUpdate);
    expect(row!.created_at).toBeLessThanOrEqual(afterUpdate);
    expect(row!.created_at).toBeGreaterThanOrEqual(firstRow!.created_at);

    const count = db.get('SELECT COUNT(*) as count FROM courses WHERE id = ?', ['course-4']);
    expect(count.count).toBe(1);
  });
});

describe('saveProgress and getProgress', () => {
  let db: any;

  beforeEach(() => {
    db = createTestDb();
  });

  it('saves a completed lesson and retrieves it', () => {
    saveProgress('course-1', 'lesson-1', true, undefined, db);
    const rows = getProgress('course-1', db);
    expect(rows).toHaveLength(1);
    expect(rows[0].lesson_id).toBe('lesson-1');
    expect(rows[0].completed).toBe(1);
  });

  it('saves an incomplete lesson with completed set to 0', () => {
    saveProgress('course-1', 'lesson-1', false, undefined, db);
    const rows = getProgress('course-1', db);
    expect(rows[0].completed).toBe(0);
  });

  it('saves optional notes alongside progress', () => {
    saveProgress('course-1', 'lesson-1', true, 'Remember to review this', db);
    const rows = getProgress('course-1', db);
    expect(rows[0].notes).toBe('Remember to review this');
  });

  it('stores null for notes when notes is explicitly passed as null at runtime', () => {
    saveProgress('course-1', 'lesson-1', true, null as any, db);
    const rows = getProgress('course-1', db);
    expect(rows[0].notes).toBeNull();
  });

  it('stores null for notes when none are provided', () => {
    saveProgress('course-1', 'lesson-1', true, undefined, db);
    const rows = getProgress('course-1', db);
    expect(rows[0].notes).toBeNull();
  });

  it('stores notes containing special characters and unicode without corruption', () => {
    saveProgress('course-1', 'lesson-1', true, `It's "important" — 日本語 & <b>bold</b>`, db);
    const rows = getProgress('course-1', db);
    expect(rows[0].notes).toBe(`It's "important" — 日本語 & <b>bold</b>`);
  });

  it('stores an empty string for notes when an empty string is provided (distinct from null)', () => {
    saveProgress('course-1', 'lesson-1', true, '', db);
    const rows = getProgress('course-1', db);
    expect(rows[0].notes).toBe('');
  });

  it('returns an empty list when no progress exists for a course', () => {
    const rows = getProgress('nonexistent-course', db);
    expect(rows).toEqual([]);
  });

  it('returns only lesson_id, completed, and notes — not course_id — for each row', () => {
    saveProgress('course-1', 'lesson-1', true, 'note', db);
    const rows = getProgress('course-1', db);
    expect(rows).toHaveLength(1);
    expect(Object.keys(rows[0]).sort()).toEqual(['completed', 'lesson_id', 'notes']);
  });

  it('returns progress only for the requested course', () => {
    saveProgress('course-1', 'lesson-1', true, undefined, db);
    saveProgress('course-2', 'lesson-1', false, undefined, db);
    const rows = getProgress('course-1', db);
    expect(rows).toHaveLength(1);
    expect(rows[0].completed).toBe(1);
  });

  it('tracks multiple lessons independently within the same course (order not guaranteed)', () => {
    saveProgress('course-1', 'lesson-1', true, undefined, db);
    saveProgress('course-1', 'lesson-2', false, undefined, db);
    const rows = getProgress('course-1', db);
    expect(rows).toHaveLength(2);
    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ lesson_id: 'lesson-1', completed: 1 }),
      expect.objectContaining({ lesson_id: 'lesson-2', completed: 0 }),
    ]));
  });

  it('overwrites existing progress when saved again for the same course and lesson, leaving only one row', () => {
    saveProgress('course-1', 'lesson-1', false, undefined, db);
    saveProgress('course-1', 'lesson-1', true, 'Updated note', db);

    const rows = getProgress('course-1', db);
    expect(rows).toHaveLength(1);
    expect(rows[0].completed).toBe(1);
    expect(rows[0].notes).toBe('Updated note');

    const count = db.get(
      'SELECT COUNT(*) as count FROM progress WHERE course_id = ? AND lesson_id = ?',
      ['course-1', 'lesson-1']
    );
    expect(count.count).toBe(1);
  });
});
