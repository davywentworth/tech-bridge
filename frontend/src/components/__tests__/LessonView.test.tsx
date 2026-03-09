import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { LessonView } from '../LessonView'
import type { Lesson } from '../../types'

// react-syntax-highlighter uses CJS/ESM-incompatible refractor in test environments
vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: { children: string }) => <pre>{children}</pre>,
}))
vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  vscDarkPlus: {},
}))

// Monaco doesn't run in happy-dom
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

// Prevent real API calls from CodeEditor
vi.mock('../../api/execute', () => ({
  runCode: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
}))

const lesson: Lesson = {
  id: 'l1',
  title: 'createSlice basics',
  explanation: 'Use **createSlice** to reduce boilerplate.',
  exercise: 'Write a counter slice.',
  knownWayCode: 'const reducer = (state, action) => state',
  targetWayCode: 'const slice = createSlice({...})',
  starterCode: '// starter',
  solutionCode: '// solution',
  language: 'javascript',
}

function renderLesson(overrides: Partial<Parameters<typeof LessonView>[0]> = {}) {
  const defaults = {
    lesson,
    knownTech: 'Redux',
    targetTech: 'Redux Toolkit',
    isCompleted: false,
    onMarkComplete: vi.fn(),
  }
  return render(<LessonView {...defaults} {...overrides} />)
}

describe('LessonView', () => {
  it('renders the lesson title', () => {
    renderLesson()
    expect(screen.getByRole('heading', { name: 'createSlice basics' })).toBeInTheDocument()
  })

  it('renders the lesson explanation as markdown with bold text', () => {
    renderLesson()
    // react-markdown converts **createSlice** to a <strong> element
    expect(screen.getByText('createSlice').tagName).toBe('STRONG')
  })

  it('renders the exercise prompt', () => {
    renderLesson()
    expect(screen.getByText('Write a counter slice.')).toBeInTheDocument()
  })

  it('shows "Mark Complete" when the lesson is not completed', () => {
    renderLesson()
    expect(screen.getByRole('button', { name: 'Mark Complete' })).toBeInTheDocument()
  })

  it('shows "✓ Completed" when the lesson is completed', () => {
    renderLesson({ isCompleted: true })
    expect(screen.getByRole('button', { name: '✓ Completed' })).toBeInTheDocument()
  })

  it('calls onMarkComplete with true when marking an incomplete lesson complete', async () => {
    const user = userEvent.setup()
    const onMarkComplete = vi.fn()
    renderLesson({ onMarkComplete })
    await user.click(screen.getByRole('button', { name: 'Mark Complete' }))
    expect(onMarkComplete).toHaveBeenCalledWith(true)
  })

  it('calls onMarkComplete with false when un-marking a completed lesson', async () => {
    const user = userEvent.setup()
    const onMarkComplete = vi.fn()
    renderLesson({ isCompleted: true, onMarkComplete })
    await user.click(screen.getByRole('button', { name: '✓ Completed' }))
    expect(onMarkComplete).toHaveBeenCalledWith(false)
  })

  it('renders the ViewToggle with "Side by Side" and "Sequential" buttons', () => {
    renderLesson()
    expect(screen.getByRole('button', { name: 'Side by Side' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sequential' })).toBeInTheDocument()
  })

  it('shows labelled code panels in side-by-side mode (the default)', () => {
    renderLesson()
    expect(screen.getByText('Redux way')).toBeInTheDocument()
    expect(screen.getByText('Redux Toolkit way')).toBeInTheDocument()
  })

  it('renders the knownWayCode content in the known-tech panel', () => {
    renderLesson()
    expect(screen.getByText('const reducer = (state, action) => state')).toBeInTheDocument()
  })

  it('renders the targetWayCode content in the target-tech panel', () => {
    renderLesson()
    expect(screen.getByText('const slice = createSlice({...})')).toBeInTheDocument()
  })

  it('shows the transition arrow in sequential mode', async () => {
    const user = userEvent.setup()
    renderLesson()
    await user.click(screen.getByRole('button', { name: 'Sequential' }))
    expect(screen.getByText(/In Redux Toolkit, this becomes:/)).toBeInTheDocument()
  })

  it('uses descriptive labels in sequential mode', async () => {
    const user = userEvent.setup()
    renderLesson()
    await user.click(screen.getByRole('button', { name: 'Sequential' }))
    expect(screen.getByText(/The Redux way \(what you know\)/)).toBeInTheDocument()
    expect(screen.getByText(/The Redux Toolkit way \(what you're learning\)/)).toBeInTheDocument()
  })

  it('shows a scroll lock toggle button in side-by-side mode, defaulting to locked', () => {
    renderLesson()
    expect(screen.getByRole('button', { name: 'Scroll locked' })).toBeInTheDocument()
  })

  it('does not show the scroll lock toggle button in sequential mode', async () => {
    const user = userEvent.setup()
    renderLesson()
    await user.click(screen.getByRole('button', { name: 'Sequential' }))
    expect(screen.queryByRole('button', { name: /Scroll/ })).not.toBeInTheDocument()
  })

  it('unlocks scroll when clicking the locked button', async () => {
    const user = userEvent.setup()
    renderLesson()
    await user.click(screen.getByRole('button', { name: 'Scroll locked' }))
    expect(screen.getByRole('button', { name: 'Scroll unlocked' })).toBeInTheDocument()
  })

  it('re-locks scroll when clicking the unlocked button', async () => {
    const user = userEvent.setup()
    renderLesson()
    await user.click(screen.getByRole('button', { name: 'Scroll locked' }))
    await user.click(screen.getByRole('button', { name: 'Scroll unlocked' }))
    expect(screen.getByRole('button', { name: 'Scroll locked' })).toBeInTheDocument()
  })

  it('mirrors left panel scroll position to right panel when scroll-locked', () => {
    renderLesson()
    const leftPanel = screen.getByTestId('left-scroll-panel')
    const rightPanel = screen.getByTestId('right-scroll-panel')

    Object.defineProperty(leftPanel, 'scrollTop', { value: 120, writable: true })
    Object.defineProperty(rightPanel, 'scrollTop', { value: 0, writable: true })
    fireEvent.scroll(leftPanel)

    expect(rightPanel.scrollTop).toBe(120)
  })

  it('mirrors right panel scroll position to left panel when scroll-locked', () => {
    renderLesson()
    const leftPanel = screen.getByTestId('left-scroll-panel')
    const rightPanel = screen.getByTestId('right-scroll-panel')

    Object.defineProperty(leftPanel, 'scrollTop', { value: 0, writable: true })
    Object.defineProperty(rightPanel, 'scrollTop', { value: 80, writable: true })
    fireEvent.scroll(rightPanel)

    expect(leftPanel.scrollTop).toBe(80)
  })

  it('does not sync scroll positions when scroll is unlocked', async () => {
    const user = userEvent.setup()
    renderLesson()
    await user.click(screen.getByRole('button', { name: 'Scroll locked' }))

    const leftPanel = screen.getByTestId('left-scroll-panel')
    const rightPanel = screen.getByTestId('right-scroll-panel')

    // Right panel starts at a known non-zero position; if sync runs, it would change
    Object.defineProperty(rightPanel, 'scrollTop', { value: 50, writable: true })
    Object.defineProperty(leftPanel, 'scrollTop', { value: 200, writable: true })
    fireEvent.scroll(leftPanel)

    expect(rightPanel.scrollTop).toBe(50)
  })

  it('snaps right panel to left panel position when re-locking', async () => {
    const user = userEvent.setup()
    renderLesson()

    await user.click(screen.getByRole('button', { name: 'Scroll locked' }))
    const leftPanel = screen.getByTestId('left-scroll-panel')
    const rightPanel = screen.getByTestId('right-scroll-panel')

    // Panels are at different scroll positions while unlocked
    Object.defineProperty(leftPanel, 'scrollTop', { value: 150, writable: true })
    Object.defineProperty(rightPanel, 'scrollTop', { value: 50, writable: true })

    await user.click(screen.getByRole('button', { name: 'Scroll unlocked' }))

    expect(rightPanel.scrollTop).toBe(150)
  })

  it('restores the scroll lock toggle when switching back to side-by-side mode', async () => {
    const user = userEvent.setup()
    renderLesson()
    await user.click(screen.getByRole('button', { name: 'Sequential' }))
    expect(screen.queryByRole('button', { name: /Scroll/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Side by Side' }))
    expect(screen.getByRole('button', { name: 'Scroll locked' })).toBeInTheDocument()
  })
})
