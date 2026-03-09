import express from 'express'
import cors from 'cors'
import logger from './logger.js'
import courseRouter from './routes/course.js'
import lessonRouter from './routes/lesson.js'
import executeRouter from './routes/execute.js'
import progressRouter from './routes/progress.js'

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`)
  next()
})

app.use('/api/course', courseRouter)
app.use('/api/lesson', lessonRouter)
app.use('/api/code', executeRouter)
app.use('/api/progress', progressRouter)

app.get('/health', (_req, res) => res.json({ ok: true }))

export default app
