import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import type { Curriculum } from '../types'
import { getCourse } from '../api/course'
import { CurriculumView } from '../components/CurriculumView'
import { useProgress } from '../hooks/useProgress'

export function CurriculumPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [curriculum, setCurriculum] = useState<Curriculum | null>(
    (location.state as { curriculum?: Curriculum } | null)?.curriculum ?? null
  )
  const [loading, setLoading] = useState(!curriculum)
  const { isCompleted } = useProgress(courseId)

  useEffect(() => {
    if (!curriculum && courseId) {
      getCourse(courseId)
        .then(setCurriculum)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [courseId, curriculum])

  if (loading) {
    return <div style={{ padding: 40, color: '#6b7280' }}>Loading curriculum…</div>
  }

  if (!curriculum) {
    return <div style={{ padding: 40, color: '#c0392b' }}>Curriculum not found.</div>
  }

  const completedIds = curriculum.modules
    .flatMap((m) => m.lessons.map((l) => l.id))
    .filter(isCompleted)

  function handleSelectLesson(_moduleId: string, lessonId: string, lessonTitle: string) {
    navigate(`/curriculum/${courseId}/lesson/${lessonId}`, {
      state: { curriculum, lessonTitle },
    })
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <CurriculumView
        curriculum={curriculum}
        completedLessonIds={completedIds}
        onSelectLesson={handleSelectLesson}
      />
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <p>Select a lesson from the sidebar to get started</p>
        </div>
      </div>
    </div>
  )
}
