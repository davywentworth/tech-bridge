import { useEffect, useRef, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import type { Curriculum, Lesson } from '../types'
import { generateLesson, getCourse } from '../api/course'
import { CurriculumView } from '../components/CurriculumView'
import { LessonView } from '../components/LessonView'
import { useProgress } from '../hooks/useProgress'

export function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as { curriculum?: Curriculum; lessonTitle?: string } | null

  const [curriculum, setCurriculum] = useState<Curriculum | null>(state?.curriculum ?? null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Capture state values at effect-trigger time via refs so the async load
  // function always sees the values from the render that fired the effect.
  const stateRef = useRef(state)
  stateRef.current = state

  const { isCompleted, markComplete } = useProgress(courseId)

  useEffect(() => {
    if (!courseId || !lessonId) {
      navigate('/')
      return
    }

    setLoading(true)
    setError(null)

    async function load() {
      try {
        // Read from ref into local variables synchronously before any await — stateRef.current
        // reflects the latest render, so any await could observe a stale value if read later.
        // On hard refresh location.state is lost — fetch curriculum from backend
        // and derive the lesson title from it using the lessonId URL param.
        let activeCurriculum = stateRef.current?.curriculum ?? null
        let activeTitle = stateRef.current?.lessonTitle ?? null

        if (!activeCurriculum) {
          activeCurriculum = await getCourse(courseId!)
          setCurriculum(activeCurriculum)
        }

        if (!activeTitle) {
          const meta = activeCurriculum.modules
            .flatMap((m) => m.lessons)
            .find((l) => l.id === lessonId)
          if (!meta) throw new Error('Lesson not found in curriculum')
          activeTitle = meta.title
        }

        const result = await generateLesson(
          activeCurriculum.knownTech,
          activeCurriculum.targetTech,
          activeTitle,
          courseId!,
          lessonId!
        )
        setLesson(result)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }

    load()
    // lessonId and courseId are the correct triggers; state is captured via stateRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, courseId])

  const completedIds =
    curriculum?.modules
      .flatMap((m) => m.lessons.map((l) => l.id))
      .filter((id) => isCompleted(id)) ?? []

  function handleSelectLesson(_moduleId: string, nextLessonId: string, lessonTitle: string) {
    navigate(`/curriculum/${courseId}/lesson/${nextLessonId}`, {
      state: { curriculum, lessonTitle },
    })
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 48px)', marginTop: 48 }}>
      {curriculum && (
        <CurriculumView
          curriculum={curriculum}
          currentLessonId={lessonId}
          completedLessonIds={completedIds}
          onSelectLesson={handleSelectLesson}
        />
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <div style={{ padding: 40, color: '#6b7280' }}>Loading lesson…</div>}
        {error && <div style={{ padding: 40, color: '#c0392b' }}>Error: {error}</div>}
        {lesson && curriculum && (
          <LessonView
            lesson={lesson}
            knownTech={curriculum.knownTech}
            targetTech={curriculum.targetTech}
            isCompleted={isCompleted(lessonId ?? '')}
            onMarkComplete={(completed) => markComplete(lessonId ?? '', completed)}
          />
        )}
      </div>
    </div>
  )
}
