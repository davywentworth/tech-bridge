import { Router } from 'express'
import { z } from 'zod'
import { generateCurriculum } from '../services/anthropic.js'
import {
  saveCourse,
  getCourse,
  getCourseByTech,
  getAllCourses,
  getProgress,
} from '../services/db.js'
import type { CourseIndexEntry, Curriculum } from '../types.js'

const router = Router()

const GenerateSchema = z.object({
  knownTech: z.string().min(1),
  targetTech: z.string().min(1),
})

router.get('/', (_req, res) => {
  const rows = getAllCourses()
  const result: CourseIndexEntry[] = rows.map((row) => {
    const curriculum: Curriculum = JSON.parse(row.curriculum)
    const allLessonIds = curriculum.modules.flatMap((m) => m.lessons.map((l) => l.id))
    const progress = getProgress(row.id)
    const completedSet = new Set(progress.filter((p) => p.completed === 1).map((p) => p.lesson_id))
    const completedLessons = allLessonIds.filter((id) => completedSet.has(id)).length
    const firstIncompleteLessonId = allLessonIds.find((id) => !completedSet.has(id)) ?? null
    return {
      id: row.id,
      knownTech: row.known_tech,
      targetTech: row.target_tech,
      totalLessons: allLessonIds.length,
      completedLessons,
      firstIncompleteLessonId,
    }
  })
  res.json(result)
})

router.post('/generate', async (req, res) => {
  const parsed = GenerateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { knownTech, targetTech } = parsed.data

  try {
    const existing = getCourseByTech(knownTech, targetTech)
    if (existing) {
      res.json(JSON.parse(existing.curriculum))
      return
    }

    const curriculum = await generateCurriculum(knownTech, targetTech)
    saveCourse(curriculum.id, knownTech, targetTech, curriculum)
    res.json(curriculum)
  } catch (err) {
    console.error('Course generation error:', err)
    res.status(500).json({ error: 'Failed to generate curriculum' })
  }
})

router.get('/:id', (req, res) => {
  const row = getCourse(req.params.id)
  if (!row) {
    res.status(404).json({ error: 'Course not found' })
    return
  }
  res.json({
    ...row,
    curriculum: JSON.parse(row.curriculum),
  })
})

export default router
