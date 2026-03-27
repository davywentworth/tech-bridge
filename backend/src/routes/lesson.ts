import { Router } from 'express'
import { z } from 'zod'
import { generateLesson } from '../services/anthropic.js'
import { getLesson, saveLesson } from '../services/db.js'

const router = Router()

const GenerateLessonSchema = z.object({
  knownTech: z.string().min(1),
  targetTech: z.string().min(1),
  lessonTitle: z.string().min(1),
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
})

router.post('/generate', async (req, res) => {
  const parsed = GenerateLessonSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { knownTech, targetTech, lessonTitle, courseId, lessonId } = parsed.data

  try {
    const cached = getLesson(courseId, lessonId)
    if (cached) {
      // Clone before mutating to avoid corrupting the object returned by the DB layer
      const lesson = { ...(cached as Record<string, unknown>) }
      // Normalize legacy cached lessons that predate the hasExercise field
      if (lesson['hasExercise'] === undefined) {
        lesson['hasExercise'] = true
      }
      res.json(lesson)
      return
    }

    const lesson = await generateLesson(knownTech, targetTech, lessonTitle)
    if (!lesson) {
      res.status(500).json({ error: 'Failed to generate lesson' })
      return
    }
    saveLesson(courseId, lessonId, lesson)
    res.json(lesson)
  } catch (err) {
    console.error('Lesson generation error:', err)
    res.status(500).json({ error: 'Failed to generate lesson' })
  }
})

export default router
