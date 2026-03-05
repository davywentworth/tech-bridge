import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

// Each test uses a unique courseId to avoid interference with other tests or the real database.
let idCounter = 0;
function uniqueCourseId() {
  return `test-course-progress-${Date.now()}-${++idCounter}`;
}

describe('GET /api/progress/:courseId', () => {
  it('returns an empty array when no progress exists for the course', async () => {
    const res = await request(app).get(`/api/progress/${uniqueCourseId()}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns saved progress entries for a course', async () => {
    const courseId = uniqueCourseId();
    await request(app)
      .put(`/api/progress/${courseId}`)
      .send({ lessonId: 'lesson-1', completed: true });

    const res = await request(app).get(`/api/progress/${courseId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].lesson_id).toBe('lesson-1');
    expect(res.body[0].completed).toBe(1);
  });

  it('returns multiple progress entries when multiple lessons have been saved', async () => {
    const courseId = uniqueCourseId();
    await request(app).put(`/api/progress/${courseId}`).send({ lessonId: 'lesson-1', completed: true });
    await request(app).put(`/api/progress/${courseId}`).send({ lessonId: 'lesson-2', completed: false });

    const res = await request(app).get(`/api/progress/${courseId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('returns only progress for the requested course, not other courses', async () => {
    const courseA = uniqueCourseId();
    const courseB = uniqueCourseId();
    await request(app).put(`/api/progress/${courseA}`).send({ lessonId: 'lesson-1', completed: true });
    await request(app).put(`/api/progress/${courseB}`).send({ lessonId: 'lesson-1', completed: false });

    const res = await request(app).get(`/api/progress/${courseA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].completed).toBe(1);
  });

  it('responds with Content-Type application/json', async () => {
    const res = await request(app).get(`/api/progress/${uniqueCourseId()}`);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

describe('PUT /api/progress/:courseId', () => {
  it('saves progress and returns { ok: true }', async () => {
    const res = await request(app)
      .put(`/api/progress/${uniqueCourseId()}`)
      .send({ lessonId: 'lesson-1', completed: true });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('saves a lesson as incomplete when completed is false', async () => {
    const courseId = uniqueCourseId();
    await request(app).put(`/api/progress/${courseId}`).send({ lessonId: 'lesson-1', completed: false });

    const res = await request(app).get(`/api/progress/${courseId}`);
    expect(res.body[0].completed).toBe(0);
  });

  it('saves optional notes alongside progress', async () => {
    const courseId = uniqueCourseId();
    await request(app)
      .put(`/api/progress/${courseId}`)
      .send({ lessonId: 'lesson-1', completed: true, notes: 'review this' });

    const res = await request(app).get(`/api/progress/${courseId}`);
    expect(res.body[0].notes).toBe('review this');
  });

  it('stores null for notes when notes is not provided', async () => {
    const courseId = uniqueCourseId();
    await request(app).put(`/api/progress/${courseId}`).send({ lessonId: 'lesson-1', completed: true });

    const res = await request(app).get(`/api/progress/${courseId}`);
    expect(res.body[0].notes).toBeNull();
  });

  it('overwrites existing progress when saved again for the same lesson', async () => {
    const courseId = uniqueCourseId();
    await request(app).put(`/api/progress/${courseId}`).send({ lessonId: 'lesson-1', completed: false });
    await request(app).put(`/api/progress/${courseId}`).send({ lessonId: 'lesson-1', completed: true, notes: 'updated' });

    const res = await request(app).get(`/api/progress/${courseId}`);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].completed).toBe(1);
    expect(res.body[0].notes).toBe('updated');
  });

  it('returns 400 when lessonId is missing', async () => {
    const res = await request(app)
      .put(`/api/progress/${uniqueCourseId()}`)
      .send({ completed: true });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when completed is missing', async () => {
    const res = await request(app)
      .put(`/api/progress/${uniqueCourseId()}`)
      .send({ lessonId: 'lesson-1' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when completed is not a boolean', async () => {
    const res = await request(app)
      .put(`/api/progress/${uniqueCourseId()}`)
      .send({ lessonId: 'lesson-1', completed: 'yes' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when completed is a number instead of a boolean', async () => {
    const res = await request(app)
      .put(`/api/progress/${uniqueCourseId()}`)
      .send({ lessonId: 'lesson-1', completed: 1 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when lessonId is an empty string', async () => {
    const res = await request(app)
      .put(`/api/progress/${uniqueCourseId()}`)
      .send({ lessonId: '', completed: true });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('clears notes when a lesson is saved again without notes after previously having them', async () => {
    const courseId = uniqueCourseId();
    await request(app).put(`/api/progress/${courseId}`).send({ lessonId: 'lesson-1', completed: true, notes: 'old note' });
    await request(app).put(`/api/progress/${courseId}`).send({ lessonId: 'lesson-1', completed: true });

    const res = await request(app).get(`/api/progress/${courseId}`);
    expect(res.body[0].notes).toBeNull();
  });

  it('GET response entries contain exactly lesson_id, completed, and notes fields', async () => {
    const courseId = uniqueCourseId();
    await request(app).put(`/api/progress/${courseId}`).send({ lessonId: 'lesson-1', completed: true, notes: 'note' });

    const res = await request(app).get(`/api/progress/${courseId}`);
    expect(Object.keys(res.body[0]).sort()).toEqual(['completed', 'lesson_id', 'notes']);
  });

  it('responds with Content-Type application/json on success', async () => {
    const res = await request(app)
      .put(`/api/progress/${uniqueCourseId()}`)
      .send({ lessonId: 'lesson-1', completed: true });

    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('returns 400 when notes is explicitly null (null is not the same as omitting the field)', async () => {
    // z.string().optional() does not accept null — only undefined (i.e., omitting the field)
    const res = await request(app)
      .put(`/api/progress/${uniqueCourseId()}`)
      .send({ lessonId: 'lesson-1', completed: true, notes: null });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('400 response body contains a structured zod error with fieldErrors', async () => {
    const res = await request(app)
      .put(`/api/progress/${uniqueCourseId()}`)
      .send({ completed: true });

    expect(res.status).toBe(400);
    expect(res.body.error).toHaveProperty('fieldErrors');
    expect(res.body.error.fieldErrors).toHaveProperty('lessonId');
  });
});
