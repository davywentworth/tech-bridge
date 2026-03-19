import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { Header } from '../Header'
import type { CourseIndexEntry } from '../../types'

vi.mock('../../api/course', () => ({
  getCourses: vi.fn(),
}))

import { getCourses } from '../../api/course'

const mockCourse: CourseIndexEntry = {
  id: 'course-1',
  knownTech: 'Redux',
  targetTech: 'Redux Toolkit',
  totalLessons: 3,
  completedLessons: 1,
  firstIncompleteLessonId: 'lesson-2',
}

const completedCourse: CourseIndexEntry = {
  id: 'course-2',
  knownTech: 'React',
  targetTech: 'Vue',
  totalLessons: 2,
  completedLessons: 2,
  firstIncompleteLessonId: null,
}

const zeroPctCourse: CourseIndexEntry = {
  id: 'course-3',
  knownTech: 'Angular',
  targetTech: 'Svelte',
  totalLessons: 4,
  completedLessons: 0,
  firstIncompleteLessonId: 'lesson-1',
}

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
      <LocationDisplay />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Header', () => {
  it('renders the hamburger button', () => {
    vi.mocked(getCourses).mockResolvedValue([])
    renderHeader()
    expect(screen.getByRole('button', { name: /open course menu/i })).toBeInTheDocument()
  })

  it('opens the dropdown menu when the hamburger button is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(getCourses).mockResolvedValue([])
    renderHeader()

    await user.click(screen.getByRole('button', { name: /open course menu/i }))
    expect(await screen.findByText('No courses yet')).toBeInTheDocument()
  })

  it('closes the dropdown when the hamburger button is clicked a second time', async () => {
    const user = userEvent.setup()
    vi.mocked(getCourses).mockResolvedValue([])
    renderHeader()

    await user.click(screen.getByRole('button', { name: /open course menu/i }))
    await screen.findByText('No courses yet')

    await user.click(screen.getByRole('button', { name: /open course menu/i }))
    expect(screen.queryByText('No courses yet')).not.toBeInTheDocument()
  })

  it('closes the dropdown when clicking outside the menu', async () => {
    const user = userEvent.setup()
    vi.mocked(getCourses).mockResolvedValue([])
    renderHeader()

    await user.click(screen.getByRole('button', { name: /open course menu/i }))
    await screen.findByText('No courses yet')

    await user.click(document.body)
    expect(screen.queryByText('No courses yet')).not.toBeInTheDocument()
  })

  it('shows course names in the dropdown after opening', async () => {
    const user = userEvent.setup()
    vi.mocked(getCourses).mockResolvedValue([mockCourse, completedCourse])
    renderHeader()

    await user.click(screen.getByRole('button', { name: /open course menu/i }))
    expect(await screen.findByText('Redux → Redux Toolkit')).toBeInTheDocument()
    expect(screen.getByText('React → Vue')).toBeInTheDocument()
  })

  it('shows a progress badge when the course has completedLessons > 0', async () => {
    const user = userEvent.setup()
    vi.mocked(getCourses).mockResolvedValue([mockCourse])
    renderHeader()

    await user.click(screen.getByRole('button', { name: /open course menu/i }))
    await screen.findByText('Redux → Redux Toolkit')
    // 1/3 lessons = 33%
    expect(screen.getByText('33%')).toBeInTheDocument()
  })

  it('does not show a progress badge when completedLessons is 0', async () => {
    const user = userEvent.setup()
    vi.mocked(getCourses).mockResolvedValue([zeroPctCourse])
    renderHeader()

    await user.click(screen.getByRole('button', { name: /open course menu/i }))
    await screen.findByText('Angular → Svelte')
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
  })

  it('navigates to the first incomplete lesson when clicking a course with incomplete lessons', async () => {
    const user = userEvent.setup()
    vi.mocked(getCourses).mockResolvedValue([mockCourse])
    renderHeader()

    await user.click(screen.getByRole('button', { name: /open course menu/i }))
    await user.click(await screen.findByText('Redux → Redux Toolkit'))

    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toBe(
        '/curriculum/course-1/lesson/lesson-2'
      )
    })
  })

  it('navigates to the curriculum page when all lessons are complete', async () => {
    const user = userEvent.setup()
    vi.mocked(getCourses).mockResolvedValue([completedCourse])
    renderHeader()

    await user.click(screen.getByRole('button', { name: /open course menu/i }))
    await user.click(await screen.findByText('React → Vue'))

    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toBe('/curriculum/course-2')
    })
  })

  it('closes the dropdown after selecting a course', async () => {
    const user = userEvent.setup()
    vi.mocked(getCourses).mockResolvedValue([mockCourse])
    renderHeader()

    await user.click(screen.getByRole('button', { name: /open course menu/i }))
    await user.click(await screen.findByText('Redux → Redux Toolkit'))

    await waitFor(() => {
      expect(screen.queryByText('Redux → Redux Toolkit')).not.toBeInTheDocument()
    })
  })

  it('shows a 100% progress badge for a fully completed course', async () => {
    const user = userEvent.setup()
    vi.mocked(getCourses).mockResolvedValue([completedCourse])
    renderHeader()

    await user.click(screen.getByRole('button', { name: /open course menu/i }))
    await screen.findByText('React → Vue')
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('shows "No courses yet" when getCourses fails', async () => {
    const user = userEvent.setup()
    vi.mocked(getCourses).mockRejectedValue(new Error('Network error'))
    renderHeader()

    await user.click(screen.getByRole('button', { name: /open course menu/i }))
    expect(await screen.findByText('No courses yet')).toBeInTheDocument()
  })
})
