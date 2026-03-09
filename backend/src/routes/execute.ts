import { Router } from 'express'
import { z } from 'zod'
import { runCode } from '../services/executor.js'

const router = Router()

const ExecuteSchema = z.object({
  code: z.string(),
  language: z.enum(['typescript', 'javascript', 'python']),
  lessonTitle: z.string().optional(),
})

router.post('/', async (req, res) => {
  const parsed = ExecuteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  try {
    const result = await runCode(parsed.data.code, parsed.data.language, parsed.data.lessonTitle)
    res.json(result)
  } catch (err) {
    console.error('Execution error:', err)
    res.status(500).json({ error: 'Code execution failed' })
  }
})

export default router
