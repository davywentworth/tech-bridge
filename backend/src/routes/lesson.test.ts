import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import { saveLesson, getLesson } from '../services/db.js'
import db from '../services/db.js'

vi.mock('../services/anthropic.js', () => ({
  generateCurriculum: vi.fn(),
  generateLesson: vi.fn(),
}))

import { generateLesson } from '../services/anthropic.js'

const mockLesson = {
  id: 'lesson-uuid-1',
  title: 'createSlice',
  explanation: 'createSlice combines action creators and reducers.',
  knownWayCode: 'const reducer = (state, action) => { ... }',
  targetWayCode: 'const slice = createSlice({ name, initialState, reducers })',
  exercise: 'Convert this Redux reducer to use createSlice.',
  starterCode: 'const counterReducer = (state = 0, action) => { ... }',
  solutionCode: 'const counterSlice = createSlice({ ... })',
  language: 'javascript',
}

const validBody = {
  knownTech: 'Redux',
  targetTech: 'Redux Toolkit',
  lessonTitle: 'createSlice',
  courseId: 'course-1',
  lessonId: 'lesson-uuid-1',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/lesson/generate', () => {
  it('returns 400 when knownTech is missing', async () => {
    const res = await request(app).post('/api/lesson/generate').send({
      targetTech: 'Redux Toolkit',
      lessonTitle: 'createSlice',
      courseId: 'c1',
      lessonId: 'l1',
    })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when targetTech is missing', async () => {
    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ knownTech: 'Redux', lessonTitle: 'createSlice', courseId: 'c1', lessonId: 'l1' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when lessonTitle is missing', async () => {
    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ knownTech: 'Redux', targetTech: 'Redux Toolkit', courseId: 'c1', lessonId: 'l1' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when courseId is missing', async () => {
    const res = await request(app).post('/api/lesson/generate').send({
      knownTech: 'Redux',
      targetTech: 'Redux Toolkit',
      lessonTitle: 'createSlice',
      lessonId: 'l1',
    })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when lessonId is missing', async () => {
    const res = await request(app).post('/api/lesson/generate').send({
      knownTech: 'Redux',
      targetTech: 'Redux Toolkit',
      lessonTitle: 'createSlice',
      courseId: 'c1',
    })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when knownTech is an empty string', async () => {
    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ ...validBody, knownTech: '' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when targetTech is an empty string', async () => {
    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ ...validBody, targetTech: '' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when lessonTitle is an empty string', async () => {
    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ ...validBody, lessonTitle: '' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when courseId is an empty string', async () => {
    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ ...validBody, courseId: '' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when lessonId is an empty string', async () => {
    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ ...validBody, lessonId: '' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns the cached lesson without calling generateLesson on a cache hit', async () => {
    // Seed the in-memory DB directly to set up the cached state
    saveLesson('cached-course', 'cached-lesson', mockLesson)

    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ ...validBody, courseId: 'cached-course', lessonId: 'cached-lesson' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual(mockLesson)
    expect(generateLesson).not.toHaveBeenCalled()
  })

  it('does not overwrite the cached lesson on a cache hit', async () => {
    // Seed the cache and record the timestamp to verify the row is not re-written
    saveLesson('no-overwrite-course', 'no-overwrite-lesson', mockLesson)
    const before = db.get('SELECT created_at FROM lessons WHERE course_id = ? AND lesson_id = ?', [
      'no-overwrite-course',
      'no-overwrite-lesson',
    ])

    await request(app)
      .post('/api/lesson/generate')
      .send({ ...validBody, courseId: 'no-overwrite-course', lessonId: 'no-overwrite-lesson' })

    const after = db.get('SELECT created_at FROM lessons WHERE course_id = ? AND lesson_id = ?', [
      'no-overwrite-course',
      'no-overwrite-lesson',
    ])
    expect(after.created_at).toBe(before.created_at)
  })

  it('cache lookup uses both courseId and lessonId — requesting a different lessonId for the same courseId is a miss and returns newly generated content', async () => {
    // Seed lesson-A with distinct content; lesson-B is NOT seeded
    const lessonAContent = { ...mockLesson, title: 'Lesson A — only this is cached' }
    saveLesson('composite-course', 'composite-lesson-A', lessonAContent)
    vi.mocked(generateLesson).mockResolvedValue(mockLesson)

    // Request lesson-B — if the key is handled correctly this is a miss and returns mockLesson
    // If the route ignores lessonId it would return lessonAContent instead
    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ ...validBody, courseId: 'composite-course', lessonId: 'composite-lesson-B' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual(mockLesson)
  })

  it('cache lookup uses both courseId and lessonId — requesting a different courseId for the same lessonId is a miss and returns newly generated content', async () => {
    // Seed course-X with distinct content; course-Y is NOT seeded
    const courseXContent = { ...mockLesson, title: 'Course X — only this is cached' }
    saveLesson('composite-course-X', 'shared-lesson', courseXContent)
    vi.mocked(generateLesson).mockResolvedValue(mockLesson)

    // Request course-Y — if the key is handled correctly this is a miss and returns mockLesson
    // If the route ignores courseId it would return courseXContent instead
    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ ...validBody, courseId: 'composite-course-Y', lessonId: 'shared-lesson' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual(mockLesson)
  })

  it('calls generateLesson with knownTech, targetTech, and lessonTitle on a cache miss', async () => {
    vi.mocked(generateLesson).mockResolvedValue(mockLesson)
    // Use unique IDs to avoid hitting state seeded by other tests in this file
    const body = {
      ...validBody,
      courseId: `miss-course-${Date.now()}-1`,
      lessonId: `miss-lesson-${Date.now()}-1`,
    }

    await request(app).post('/api/lesson/generate').send(body)

    expect(generateLesson).toHaveBeenCalledWith('Redux', 'Redux Toolkit', 'createSlice')
  })

  it('returns the generated lesson on a cache miss', async () => {
    vi.mocked(generateLesson).mockResolvedValue(mockLesson)
    // Use unique IDs to avoid hitting state seeded by other tests in this file
    const body = {
      ...validBody,
      courseId: `miss-course-${Date.now()}-2`,
      lessonId: `miss-lesson-${Date.now()}-2`,
    }

    const res = await request(app).post('/api/lesson/generate').send(body)

    expect(res.status).toBe(200)
    expect(res.body).toEqual(mockLesson)
  })

  it('saves the generated lesson to the database on a cache miss', async () => {
    vi.mocked(generateLesson).mockResolvedValue(mockLesson)
    const courseId = `persist-course-${Date.now()}`
    const lessonId = `persist-lesson-${Date.now()}`

    await request(app)
      .post('/api/lesson/generate')
      .send({ ...validBody, courseId, lessonId })

    expect(getLesson(courseId, lessonId)).toEqual(mockLesson)
  })

  it('returns 500 when lesson generation fails', async () => {
    vi.mocked(generateLesson).mockRejectedValue(new Error('API error'))
    const body = {
      ...validBody,
      courseId: `fail-course-${Date.now()}`,
      lessonId: `fail-lesson-${Date.now()}`,
    }

    const res = await request(app).post('/api/lesson/generate').send(body)

    expect(res.status).toBe(500)
    expect(res.body.error).toBe('Failed to generate lesson')
  })

  it('400 response body contains a structured zod error with fieldErrors', async () => {
    const res = await request(app).post('/api/lesson/generate').send({
      targetTech: 'Redux Toolkit',
      lessonTitle: 'createSlice',
      courseId: 'c1',
      lessonId: 'l1',
    })

    expect(res.status).toBe(400)
    expect(res.body.error).toHaveProperty('fieldErrors')
    expect(res.body.error.fieldErrors).toHaveProperty('knownTech')
  })

  it('responds with Content-Type application/json on success', async () => {
    vi.mocked(generateLesson).mockResolvedValue(mockLesson)
    const body = {
      ...validBody,
      courseId: `ct-course-${Date.now()}`,
      lessonId: `ct-lesson-${Date.now()}`,
    }

    const res = await request(app).post('/api/lesson/generate').send(body)

    expect(res.headers['content-type']).toMatch(/application\/json/)
  })
})
