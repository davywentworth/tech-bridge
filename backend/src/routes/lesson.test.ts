import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app.js'

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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/lesson/generate', () => {
  it('returns 400 when knownTech is missing', async () => {
    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ targetTech: 'Redux Toolkit', lessonTitle: 'createSlice' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when targetTech is missing', async () => {
    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ knownTech: 'Redux', lessonTitle: 'createSlice' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when lessonTitle is missing', async () => {
    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ knownTech: 'Redux', targetTech: 'Redux Toolkit' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when knownTech is an empty string', async () => {
    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ knownTech: '', targetTech: 'Redux Toolkit', lessonTitle: 'createSlice' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when targetTech is an empty string', async () => {
    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ knownTech: 'Redux', targetTech: '', lessonTitle: 'createSlice' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when lessonTitle is an empty string', async () => {
    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ knownTech: 'Redux', targetTech: 'Redux Toolkit', lessonTitle: '' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('calls generateLesson with knownTech, targetTech, and lessonTitle', async () => {
    vi.mocked(generateLesson).mockResolvedValue(mockLesson)

    await request(app)
      .post('/api/lesson/generate')
      .send({ knownTech: 'Redux', targetTech: 'Redux Toolkit', lessonTitle: 'createSlice' })

    expect(generateLesson).toHaveBeenCalledWith('Redux', 'Redux Toolkit', 'createSlice')
  })

  it('returns the generated lesson', async () => {
    vi.mocked(generateLesson).mockResolvedValue(mockLesson)

    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ knownTech: 'Redux', targetTech: 'Redux Toolkit', lessonTitle: 'createSlice' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual(mockLesson)
  })

  it('returns 500 when lesson generation fails', async () => {
    vi.mocked(generateLesson).mockRejectedValue(new Error('API error'))

    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ knownTech: 'Redux', targetTech: 'Redux Toolkit', lessonTitle: 'createSlice' })

    expect(res.status).toBe(500)
    expect(res.body).toHaveProperty('error')
  })

  it('400 response body contains a structured zod error with fieldErrors', async () => {
    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ targetTech: 'Redux Toolkit', lessonTitle: 'createSlice' })

    expect(res.status).toBe(400)
    expect(res.body.error).toHaveProperty('fieldErrors')
    expect(res.body.error.fieldErrors).toHaveProperty('knownTech')
  })

  it('responds with Content-Type application/json on success', async () => {
    vi.mocked(generateLesson).mockResolvedValue(mockLesson)

    const res = await request(app)
      .post('/api/lesson/generate')
      .send({ knownTech: 'Redux', targetTech: 'Redux Toolkit', lessonTitle: 'createSlice' })

    expect(res.headers['content-type']).toMatch(/application\/json/)
  })
})
