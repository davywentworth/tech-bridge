import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app.js'

describe('POST /api/code', () => {
  it('executes javascript and returns stdout', async () => {
    const res = await request(app)
      .post('/api/code')
      .send({ code: 'console.log("hello from js")', language: 'javascript' })

    expect(res.status).toBe(200)
    expect(res.body.stdout).toContain('hello from js')
    expect(res.body.exitCode).toBe(0)
  })

  it('executes typescript and returns stdout', async () => {
    const res = await request(app)
      .post('/api/code')
      .send({ code: 'const x: number = 42; console.log(x)', language: 'typescript' })

    expect(res.status).toBe(200)
    expect(res.body.stdout).toContain('42')
    expect(res.body.exitCode).toBe(0)
  })

  it('executes python and returns stdout', async () => {
    const res = await request(app)
      .post('/api/code')
      .send({ code: 'print("hello from python")', language: 'python' })

    expect(res.status).toBe(200)
    expect(res.body.stdout).toContain('hello from python')
    expect(res.body.exitCode).toBe(0)
  })

  it('returns stderr and non-zero exit code when the code throws a runtime error', async () => {
    const res = await request(app)
      .post('/api/code')
      .send({ code: 'throw new Error("boom")', language: 'javascript' })

    expect(res.status).toBe(200)
    expect(res.body.stderr).toContain('boom')
    expect(res.body.exitCode).not.toBe(0)
  })

  it('returns 400 when language is missing', async () => {
    const res = await request(app).post('/api/code').send({ code: 'console.log("hi")' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when language is not one of the allowed values', async () => {
    const res = await request(app)
      .post('/api/code')
      .send({ code: 'console.log("hi")', language: 'ruby' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns stdout and stderr separately when code writes to both', async () => {
    const res = await request(app)
      .post('/api/code')
      .send({ code: 'console.log("out"); console.error("err")', language: 'javascript' })

    expect(res.status).toBe(200)
    expect(res.body.stdout).toContain('out')
    expect(res.body.stderr).toContain('err')
    expect(res.body.exitCode).toBe(0)
  })

  it('returns an empty stdout string when the code produces no output', async () => {
    const res = await request(app)
      .post('/api/code')
      .send({ code: 'const x = 1 + 1;', language: 'javascript' })

    expect(res.status).toBe(200)
    expect(res.body.stdout).toBe('')
    expect(res.body.exitCode).toBe(0)
  })

  it('response always includes stdout, stderr, and exitCode fields', async () => {
    const res = await request(app)
      .post('/api/code')
      .send({ code: 'console.log("x")', language: 'javascript' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('stdout')
    expect(res.body).toHaveProperty('stderr')
    expect(res.body).toHaveProperty('exitCode')
  })

  it('returns 400 when code is missing', async () => {
    const res = await request(app).post('/api/code').send({ language: 'javascript' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('accepts an empty string for code and executes it (producing no output)', async () => {
    // z.string() with no .min(1) allows empty strings — they pass validation and run as empty code
    const res = await request(app).post('/api/code').send({ code: '', language: 'javascript' })

    expect(res.status).toBe(200)
    expect(res.body.stdout).toBe('')
    expect(res.body.exitCode).toBe(0)
  })

  it('accepts an optional lessonTitle and still executes successfully', async () => {
    const res = await request(app)
      .post('/api/code')
      .send({ code: 'console.log("with title")', language: 'javascript', lessonTitle: 'My Lesson' })

    expect(res.status).toBe(200)
    expect(res.body.stdout).toContain('with title')
    expect(res.body.exitCode).toBe(0)
  })

  it('returns 400 when the request body is empty', async () => {
    const res = await request(app).post('/api/code').send({})

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns stderr and non-zero exit code when python raises a runtime error', async () => {
    const res = await request(app)
      .post('/api/code')
      .send({ code: 'raise Exception("python boom")', language: 'python' })

    expect(res.status).toBe(200)
    expect(res.body.stderr).toContain('python boom')
    expect(res.body.exitCode).not.toBe(0)
  })

  it('returns stderr and non-zero exit code when typescript has a syntax error', async () => {
    // tsx transpiles without type-checking, so only syntax errors (not type errors) cause failures
    const res = await request(app)
      .post('/api/code')
      .send({ code: 'const x = {;', language: 'typescript' })

    expect(res.status).toBe(200)
    expect(res.body.stderr).toBeTruthy()
    expect(res.body.exitCode).not.toBe(0)
  })

  it('responds with Content-Type application/json', async () => {
    const res = await request(app)
      .post('/api/code')
      .send({ code: 'console.log("hi")', language: 'javascript' })

    expect(res.headers['content-type']).toMatch(/application\/json/)
  })

  it('responds with Content-Type application/json on 400 errors', async () => {
    const res = await request(app).post('/api/code').send({})

    expect(res.headers['content-type']).toMatch(/application\/json/)
  })
})
