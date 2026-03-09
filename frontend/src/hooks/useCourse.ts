import { useState } from 'react'
import type { Curriculum } from '../types'
import { generateCourse } from '../api/course'

export function useCourse() {
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate(knownTech: string, targetTech: string) {
    setLoading(true)
    setError(null)
    try {
      const result = await generateCourse(knownTech, targetTech)
      setCurriculum(result)
      return result
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { curriculum, loading, error, generate }
}
