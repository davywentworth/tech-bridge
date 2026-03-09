import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import { saveCourse } from '../services/db.js'

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

beforeEach(() => {
  vi.clearAllMocks()
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

  it('calls generateCurriculum with the provided knownTech and targetTech', async () => {
    vi.mocked(generateCurriculum).mockResolvedValue(mockCurriculum)

    await request(app)
      .post('/api/course/generate')
      .send({ knownTech: 'Redux', targetTech: 'Redux Toolkit' })

    expect(generateCurriculum).toHaveBeenCalledWith('Redux', 'Redux Toolkit')
  })

  it('saves the generated curriculum to the database and returns it', async () => {
    vi.mocked(generateCurriculum).mockResolvedValue(mockCurriculum)

    const res = await request(app)
      .post('/api/course/generate')
      .send({ knownTech: 'Redux', targetTech: 'Redux Toolkit' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual(mockCurriculum)
  })

  it('returns 500 when curriculum generation fails', async () => {
    vi.mocked(generateCurriculum).mockRejectedValue(new Error('API error'))

    const res = await request(app)
      .post('/api/course/generate')
      .send({ knownTech: 'Redux', targetTech: 'Redux Toolkit' })

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
