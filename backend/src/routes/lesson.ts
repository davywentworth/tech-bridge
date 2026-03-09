import { Router } from 'express'
import { z } from 'zod'
import { generateLesson } from '../services/anthropic.js'

const router = Router()

const GenerateLessonSchema = z.object({
  knownTech: z.string().min(1),
  targetTech: z.string().min(1),
  lessonTitle: z.string().min(1),
})

router.post('/generate', async (req, res) => {
  const parsed = GenerateLessonSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { knownTech, targetTech, lessonTitle } = parsed.data

  try {
    const lesson = await generateLesson(knownTech, targetTech, lessonTitle)
    res.json(lesson)
  } catch (err) {
    console.error('Lesson generation error:', err)
    res.status(500).json({ error: 'Failed to generate lesson' })
  }
})

export default router
