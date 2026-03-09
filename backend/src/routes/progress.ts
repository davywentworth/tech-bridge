import { Router } from 'express'
import { z } from 'zod'
import { getProgress, saveProgress } from '../services/db.js'

const router = Router()

router.get('/:courseId', (req, res) => {
  const progress = getProgress(req.params.courseId)
  res.json(progress)
})

const SaveProgressSchema = z.object({
  lessonId: z.string().min(1),
  completed: z.boolean(),
  notes: z.string().optional(),
})

router.put('/:courseId', (req, res) => {
  const parsed = SaveProgressSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { lessonId, completed, notes } = parsed.data
  saveProgress(req.params.courseId, lessonId, completed, notes)
  res.json({ ok: true })
})

export default router
