import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CourseIndexEntry } from '../types'
import { getCourses } from '../api/course'

export function Header() {
  const [open, setOpen] = useState(false)
  const [courses, setCourses] = useState<CourseIndexEntry[]>([])
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    let cancelled = false
    getCourses()
      .then((data) => {
        if (!cancelled) setCourses(data)
      })
      .catch(console.error)
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleCourseClick(course: CourseIndexEntry) {
    setOpen(false)
    if (course.firstIncompleteLessonId) {
      navigate(`/curriculum/${course.id}/lesson/${course.firstIncompleteLessonId}`)
    } else {
      navigate(`/curriculum/${course.id}`)
    }
  }

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 48,
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        zIndex: 1000,
      }}
    >
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          aria-label="Open course menu"
          onClick={() => setOpen((o) => !o)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: 20,
            lineHeight: 1,
          }}
        >
          ☰
        </button>
        {open && (
          <div
            style={{
              position: 'absolute',
              top: 40,
              left: 0,
              minWidth: 280,
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
          >
            {courses.length === 0 ? (
              <div style={{ padding: '12px 16px', color: '#9ca3af', fontSize: 14 }}>
                No courses yet
              </div>
            ) : (
              courses.map((course) => {
                const pct =
                  course.totalLessons > 0
                    ? Math.round((course.completedLessons / course.totalLessons) * 100)
                    : 0
                return (
                  <button
                    key={course.id}
                    onClick={() => handleCourseClick(course)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 16px',
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: 14,
                      fontFamily: 'inherit',
                    }}
                  >
                    <span>
                      {course.knownTech} → {course.targetTech}
                    </span>
                    {pct > 0 && (
                      <span
                        style={{
                          background: '#dbeafe',
                          color: '#1d4ed8',
                          borderRadius: 12,
                          padding: '2px 8px',
                          fontSize: 12,
                          fontWeight: 600,
                          marginLeft: 8,
                        }}
                      >
                        {pct}%
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>
    </header>
  )
}
