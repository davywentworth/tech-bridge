import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import { saveCourse, saveProgress, resetDb } from '../services/db.js'

vi.mock('../services/anthropic.js', () => ({
  generateCurriculum: vi.fn(),
  generateLesson: vi.fn(),
}))

import { generateCurriculum } from '../services/anthropic.js'

const mockCurriculum = {
  id: 'curriculum-uuid-1',
  knownTech: 'Redux',
  targetTech: 'Redux Toolkit',
  description: 'Learn Redux Toolkit if you already know Redux.',
  modules: [
    {
      id: 'module-1',
      title: 'Getting Started',
      lessons: [{ id: 'lesson-1', title: 'createSlice' }],
    },
  ],
}

beforeAll(() => {
  resetDb()
})

beforeEach(() => {
  vi.clearAllMocks()
})

const multiLessonCurriculum = {
  id: 'multi-lesson-id',
  knownTech: 'React',
  targetTech: 'Vue',
  description: 'Learn Vue if you already know React.',
  modules: [
    {
      id: 'mod-1',
      title: 'Basics',
      lessons: [
        { id: 'lesson-a', title: 'Lesson A' },
        { id: 'lesson-b', title: 'Lesson B' },
        { id: 'lesson-c', title: 'Lesson C' },
      ],
    },
  ],
}

describe('GET /api/course', () => {
  beforeEach(() => {
    resetDb()
  })

  it('returns an empty array when no courses exist', async () => {
    const res = await request(app).get('/api/course')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns correct fields for a course with no progress', async () => {
    saveCourse('index-no-progress', 'Preact', 'SolidJS', multiLessonCurriculum)

    const res = await request(app).get('/api/course')
    expect(res.status).toBe(200)
    const entry = res.body.find((c: { id: string }) => c.id === 'index-no-progress')
    expect(entry).toMatchObject({
      id: 'index-no-progress',
      knownTech: 'Preact',
      targetTech: 'SolidJS',
      totalLessons: 3,
      completedLessons: 0,
      firstIncompleteLessonId: 'lesson-a',
    })
  })

  it('computes completedLessons count correctly when some lessons are marked done', async () => {
    saveCourse('index-partial', 'Lit', 'Stencil', multiLessonCurriculum)
    saveProgress('index-partial', 'lesson-a', true)
    saveProgress('index-partial', 'lesson-b', true)

    const res = await request(app).get('/api/course')
    const entry = res.body.find((c: { id: string }) => c.id === 'index-partial')
    expect(entry.completedLessons).toBe(2)
    expect(entry.totalLessons).toBe(3)
  })

  it('firstIncompleteLessonId points to the first non-completed lesson in order', async () => {
    saveCourse('index-first-incomplete', 'Inferno', 'Mithril', multiLessonCurriculum)
    saveProgress('index-first-incomplete', 'lesson-a', true)

    const res = await request(app).get('/api/course')
    const entry = res.body.find((c: { id: string }) => c.id === 'index-first-incomplete')
    expect(entry.firstIncompleteLessonId).toBe('lesson-b')
  })

  it('firstIncompleteLessonId is null when all lessons are complete', async () => {
    saveCourse('index-all-done', 'Aurelia', 'Alpine', multiLessonCurriculum)
    saveProgress('index-all-done', 'lesson-a', true)
    saveProgress('index-all-done', 'lesson-b', true)
    saveProgress('index-all-done', 'lesson-c', true)

    const res = await request(app).get('/api/course')
    const entry = res.body.find((c: { id: string }) => c.id === 'index-all-done')
    expect(entry.firstIncompleteLessonId).toBeNull()
  })

  it('returns results ordered newest-first', async () => {
    const now = Date.now()
    saveCourse('index-older', 'Dojo', 'Marko', multiLessonCurriculum, undefined, now - 1000)
    saveCourse('index-newer', 'Dojo', 'Qwik', multiLessonCurriculum, undefined, now)

    const res = await request(app).get('/api/course')
    const ids = res.body.map((c: { id: string }) => c.id)
    expect(ids.indexOf('index-newer')).toBeLessThan(ids.indexOf('index-older'))
  })
})

describe('POST /api/course/generate', () => {
  it('returns 400 when knownTech is missing', async () => {
    const res = await request(app)
      .post('/api/course/generate')
      .send({ targetTech: 'Redux Toolkit' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when targetTech is missing', async () => {
    const res = await request(app).post('/api/course/generate').send({ knownTech: 'Redux' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when knownTech is an empty string', async () => {
    const res = await request(app)
      .post('/api/course/generate')
      .send({ knownTech: '', targetTech: 'Redux Toolkit' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when targetTech is an empty string', async () => {
    const res = await request(app)
      .post('/api/course/generate')
      .send({ knownTech: 'Redux', targetTech: '' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns the cached curriculum without calling generateCurriculum when the tech pair already exists', async () => {
    saveCourse('cached-course-id', 'React', 'Vue', mockCurriculum)

    const res = await request(app)
      .post('/api/course/generate')
      .send({ knownTech: 'React', targetTech: 'Vue' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual(mockCurriculum)
    expect(generateCurriculum).not.toHaveBeenCalled()
  })

  it('calls generateCurriculum with the provided knownTech and targetTech on a cache miss', async () => {
    vi.mocked(generateCurriculum).mockResolvedValue(mockCurriculum)
    // Use unique tech names to avoid hitting state seeded by other tests in this file
    const knownTech = `Redux-miss-${Date.now()}-1`
    const targetTech = `Redux Toolkit-miss-${Date.now()}-1`

    await request(app).post('/api/course/generate').send({ knownTech, targetTech })

    expect(generateCurriculum).toHaveBeenCalledWith(knownTech, targetTech)
  })

  it('saves the generated curriculum and returns it on a cache miss, verified by a follow-up request skipping generation', async () => {
    vi.mocked(generateCurriculum).mockResolvedValue(mockCurriculum)
    // Use unique tech names to avoid hitting state seeded by other tests in this file
    const knownTech = `REST-persist-${Date.now()}`
    const targetTech = `GraphQL-persist-${Date.now()}`

    const firstRes = await request(app).post('/api/course/generate').send({ knownTech, targetTech })
    expect(firstRes.status).toBe(200)
    expect(firstRes.body).toEqual(mockCurriculum)

    // A second request for the same pair must return the cached result without calling generateCurriculum again
    vi.clearAllMocks()
    const secondRes = await request(app)
      .post('/api/course/generate')
      .send({ knownTech, targetTech })
    expect(secondRes.status).toBe(200)
    expect(secondRes.body).toEqual(mockCurriculum)
    expect(generateCurriculum).not.toHaveBeenCalled()
  })

  it('cache hit is case-insensitive — returns cached curriculum when tech pair differs only in letter case', async () => {
    saveCourse('case-test-id', 'Redux', 'Zustand', mockCurriculum)

    const res = await request(app)
      .post('/api/course/generate')
      .send({ knownTech: 'redux', targetTech: 'zustand' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual(mockCurriculum)
    expect(generateCurriculum).not.toHaveBeenCalled()
  })

  it('returns 500 when curriculum generation fails', async () => {
    vi.mocked(generateCurriculum).mockRejectedValue(new Error('API error'))
    const knownTech = `fail-${Date.now()}`
    const targetTech = `fail-target-${Date.now()}`

    const res = await request(app).post('/api/course/generate').send({ knownTech, targetTech })

    expect(res.status).toBe(500)
    expect(res.body).toHaveProperty('error')
  })

  it('400 response body contains a structured zod error with fieldErrors', async () => {
    const res = await request(app)
      .post('/api/course/generate')
      .send({ targetTech: 'Redux Toolkit' })

    expect(res.status).toBe(400)
    expect(res.body.error).toHaveProperty('fieldErrors')
    expect(res.body.error.fieldErrors).toHaveProperty('knownTech')
  })
})

describe('GET /api/course/:id', () => {
  it('returns 404 when the course does not exist', async () => {
    const res = await request(app).get('/api/course/nonexistent-id')

    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })

  it('returns the course with curriculum parsed as an object (not a raw JSON string)', async () => {
    saveCourse('test-course-get-1', 'Redux', 'Redux Toolkit', mockCurriculum)

    const res = await request(app).get('/api/course/test-course-get-1')

    expect(res.status).toBe(200)
    expect(typeof res.body.curriculum).toBe('object')
    expect(res.body.curriculum).toEqual(mockCurriculum)
  })

  it('returns the course with all expected fields', async () => {
    saveCourse('test-course-get-2', 'React', 'Vue', mockCurriculum)

    const res = await request(app).get('/api/course/test-course-get-2')

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      id: 'test-course-get-2',
      known_tech: 'React',
      target_tech: 'Vue',
    })
    expect(res.body).toHaveProperty('curriculum')
    expect(typeof res.body.created_at).toBe('number')
  })

  it('responds with Content-Type application/json on success', async () => {
    saveCourse('test-course-content-type', 'A', 'B', mockCurriculum)
    const res = await request(app).get('/api/course/test-course-content-type')
    expect(res.headers['content-type']).toMatch(/application\/json/)
  })

  it('responds with Content-Type application/json on 404', async () => {
    const res = await request(app).get('/api/course/does-not-exist')
    expect(res.headers['content-type']).toMatch(/application\/json/)
  })
})
