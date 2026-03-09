import { useState, useEffect } from 'react'
import type { ProgressEntry } from '../types'
import { getProgress, saveProgress } from '../api/progress'

export function useProgress(courseId: string | undefined) {
  const [progress, setProgress] = useState<ProgressEntry[]>([])

  useEffect(() => {
    if (!courseId) return
    getProgress(courseId)
      .then(setProgress)
      .catch(() => {})
  }, [courseId])

  function isCompleted(lessonId: string): boolean {
    return progress.some((p) => p.lesson_id === lessonId && p.completed === 1)
  }

  async function markComplete(lessonId: string, completed: boolean) {
    if (!courseId) return
    await saveProgress(courseId, lessonId, completed)
    setProgress((prev) => {
      const filtered = prev.filter((p) => p.lesson_id !== lessonId)
      return [...filtered, { lesson_id: lessonId, completed: completed ? 1 : 0 }]
    })
  }

  return { progress, isCompleted, markComplete }
}
