import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEffect } from 'react'
import { CodeEditor } from '../CodeEditor'
import type { Lesson } from '../../types'

// Capture the ResizeObserver callback so tests can invoke it manually
let resizeObserverCallback: ResizeObserverCallback | undefined
const mockDisconnect = vi.fn()
global.ResizeObserver = class {
  constructor(cb: ResizeObserverCallback) {
    resizeObserverCallback = cb
  }
  observe() {}
  disconnect() {
    mockDisconnect()
  }
  unobserve() {}
}

// Capture the Monaco editor instance mock so tests can assert on it
const mockLayout = vi.fn()
vi.mock('@monaco-editor/react', () => {
  function MonacoEditorMock({
    value,
    onChange,
    onMount,
  }: {
    value: string
    onChange: (val: string) => void
    onMount?: (editor: { layout: () => void }) => void
  }) {
    // Call onMount after mount to match real Monaco's post-mount timing
    useEffect(() => {
      onMount?.({ layout: mockLayout })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return (
      <textarea
        data-testid="monaco-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }
  return { default: MonacoEditorMock }
})

vi.mock('../../api/execute', () => ({
  runCode: vi.fn(),
}))

import { runCode } from '../../api/execute'
const mockRunCode = vi.mocked(runCode)

const lesson: Lesson = {
  id: 'l1',
  title: 'createSlice basics',
  explanation: 'Explanation text',
  knownWayCode: 'const store = createStore(reducer)',
  targetWayCode: 'const slice = createSlice({...})',
  exercise: 'Write a slice',
  starterCode: '// starter',
  solutionCode: '// solution',
  language: 'javascript',
}

describe('CodeEditor', () => {
  beforeEach(() => {
    mockRunCode.mockClear()
    mockRunCode.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
    mockLayout.mockClear()
    mockDisconnect.mockClear()
  })

  it('displays the lesson language label', () => {
    render(<CodeEditor lesson={lesson} />)
    expect(screen.getByText('javascript')).toBeInTheDocument()
  })

  it('loads the editor with the starter code', () => {
    render(<CodeEditor lesson={lesson} />)
    expect(screen.getByTestId('monaco-editor')).toHaveValue('// starter')
  })

  it('shows the "Show Solution" button initially', () => {
    render(<CodeEditor lesson={lesson} />)
    expect(screen.getByRole('button', { name: 'Show Solution' })).toBeInTheDocument()
  })

  it('shows the Run button initially', () => {
    render(<CodeEditor lesson={lesson} />)
    expect(screen.getByRole('button', { name: '▶ Run' })).toBeInTheDocument()
  })

  it('replaces editor content with solution code when "Show Solution" is clicked', async () => {
    const user = userEvent.setup()
    render(<CodeEditor lesson={lesson} />)
    await user.click(screen.getByRole('button', { name: 'Show Solution' }))
    expect(screen.getByTestId('monaco-editor')).toHaveValue('// solution')
  })

  it('hides the "Show Solution" button after it is clicked', async () => {
    const user = userEvent.setup()
    render(<CodeEditor lesson={lesson} />)
    await user.click(screen.getByRole('button', { name: 'Show Solution' }))
    expect(screen.queryByRole('button', { name: 'Show Solution' })).not.toBeInTheDocument()
  })

  it('calls runCode with the current code and lesson details when Run is clicked', async () => {
    const user = userEvent.setup()
    render(<CodeEditor lesson={lesson} />)
    await user.click(screen.getByRole('button', { name: '▶ Run' }))
    expect(mockRunCode).toHaveBeenCalledWith('// starter', 'javascript', 'createSlice basics')
  })

  it('runs the code the user typed rather than the original starter code', async () => {
    const user = userEvent.setup()
    render(<CodeEditor lesson={lesson} />)
    await user.clear(screen.getByTestId('monaco-editor'))
    await user.type(screen.getByTestId('monaco-editor'), 'console.log(42)')
    await user.click(screen.getByRole('button', { name: '▶ Run' }))
    expect(mockRunCode).toHaveBeenCalledWith('console.log(42)', 'javascript', 'createSlice basics')
  })

  it('disables the Run button while code is executing', async () => {
    const user = userEvent.setup()
    // Hold the promise open so we can observe the mid-flight state
    let resolve!: (val: { stdout: string; stderr: string; exitCode: number }) => void
    mockRunCode.mockReturnValue(new Promise((r) => { resolve = r }))
    render(<CodeEditor lesson={lesson} />)
    await user.click(screen.getByRole('button', { name: '▶ Run' }))
    expect(screen.getByRole('button', { name: 'Running…' })).toBeDisabled()
    // Resolve to avoid act() warnings about pending state updates
    await act(async () => { resolve({ stdout: '', stderr: '', exitCode: 0 }) })
  })

  it('shows output panel with stdout after a successful run', async () => {
    const user = userEvent.setup()
    mockRunCode.mockResolvedValue({ stdout: 'hello', stderr: '', exitCode: 0 })
    render(<CodeEditor lesson={lesson} />)
    await user.click(screen.getByRole('button', { name: '▶ Run' }))
    await waitFor(() => expect(screen.getByText('hello')).toBeInTheDocument())
  })

  it('shows output panel with stderr when execution fails', async () => {
    const user = userEvent.setup()
    mockRunCode.mockResolvedValue({
      stdout: '',
      stderr: 'ReferenceError: x is not defined',
      exitCode: 1,
    })
    render(<CodeEditor lesson={lesson} />)
    await user.click(screen.getByRole('button', { name: '▶ Run' }))
    await waitFor(() =>
      expect(screen.getByText('ReferenceError: x is not defined')).toBeInTheDocument()
    )
  })

  it('shows a caught error in the output panel if runCode throws', async () => {
    const user = userEvent.setup()
    mockRunCode.mockRejectedValue(new Error('Network error'))
    render(<CodeEditor lesson={lesson} />)
    await user.click(screen.getByRole('button', { name: '▶ Run' }))
    await waitFor(() => expect(screen.getByText('Error: Network error')).toBeInTheDocument())
  })

  it('re-enables the Run button after execution completes', async () => {
    const user = userEvent.setup()
    render(<CodeEditor lesson={lesson} />)
    await user.click(screen.getByRole('button', { name: '▶ Run' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '▶ Run' })).not.toBeDisabled())
  })

  it('runs the solution code (not the starter) after clicking Show Solution then Run', async () => {
    const user = userEvent.setup()
    render(<CodeEditor lesson={lesson} />)
    await user.click(screen.getByRole('button', { name: 'Show Solution' }))
    await user.click(screen.getByRole('button', { name: '▶ Run' }))
    expect(mockRunCode).toHaveBeenCalledWith('// solution', 'javascript', 'createSlice basics')
  })

  it('resets editor code to new starter code when the lesson prop changes', async () => {
    const { rerender } = render(<CodeEditor lesson={lesson} />)
    const nextLesson = { ...lesson, starterCode: '// next lesson', solutionCode: '// next-sol' }
    rerender(<CodeEditor lesson={nextLesson} />)
    expect(screen.getByTestId('monaco-editor')).toHaveValue('// next lesson')
  })

  it('shows the "Show Solution" button again after navigating to a new lesson', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<CodeEditor lesson={lesson} />)
    await user.click(screen.getByRole('button', { name: 'Show Solution' }))
    expect(screen.queryByRole('button', { name: 'Show Solution' })).not.toBeInTheDocument()
    rerender(<CodeEditor lesson={{ ...lesson, id: 'l2', starterCode: '// next' }} />)
    expect(screen.getByRole('button', { name: 'Show Solution' })).toBeInTheDocument()
  })

  it('clears the output panel when navigating to a new lesson', async () => {
    const user = userEvent.setup()
    mockRunCode.mockResolvedValue({ stdout: 'previous output', stderr: '', exitCode: 0 })
    const { rerender } = render(<CodeEditor lesson={lesson} />)
    await user.click(screen.getByRole('button', { name: '▶ Run' }))
    await waitFor(() => expect(screen.getByText('previous output')).toBeInTheDocument())
    rerender(<CodeEditor lesson={{ ...lesson, id: 'l2', starterCode: '// next' }} />)
    expect(screen.queryByText('previous output')).not.toBeInTheDocument()
  })

  it('shows an empty output panel when both stdout and stderr are empty strings', async () => {
    const user = userEvent.setup()
    mockRunCode.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
    render(<CodeEditor lesson={lesson} />)
    await user.click(screen.getByRole('button', { name: '▶ Run' }))
    await waitFor(() => expect(screen.getByText('No output')).toBeInTheDocument())
  })

  it('re-enables the Run button after a rejected execution', async () => {
    const user = userEvent.setup()
    mockRunCode.mockRejectedValue(new Error('Network error'))
    render(<CodeEditor lesson={lesson} />)
    await user.click(screen.getByRole('button', { name: '▶ Run' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '▶ Run' })).not.toBeDisabled())
  })

  it('does not fire a second runCode call when Run is clicked while already executing', async () => {
    const user = userEvent.setup()
    let resolve!: (val: { stdout: string; stderr: string; exitCode: number }) => void
    mockRunCode.mockReturnValue(new Promise((r) => { resolve = r }))
    render(<CodeEditor lesson={lesson} />)
    await user.click(screen.getByRole('button', { name: '▶ Run' }))
    // Button is now disabled — a second click should be blocked
    await user.click(screen.getByRole('button', { name: 'Running…' }))
    await act(async () => { resolve({ stdout: '', stderr: '', exitCode: 0 }) })
    expect(mockRunCode).toHaveBeenCalledTimes(1)
  })

  it('calls Monaco layout() on initial mount after the editor is ready', () => {
    render(<CodeEditor lesson={lesson} />)
    // editorRef is populated synchronously by the mock onMount, so the initial
    // layout() call in the ResizeObserver useEffect fires during mount
    expect(mockLayout).toHaveBeenCalled()
  })

  it('resets editor state when a new lesson object with the same id is passed', () => {
    // React useEffect uses Object.is — a new object reference always triggers reset,
    // even if the content is identical. This test pins that behavior.
    const { rerender } = render(<CodeEditor lesson={lesson} />)
    const sameIdNewRef = { ...lesson }
    rerender(<CodeEditor lesson={sameIdNewRef} />)
    expect(screen.getByTestId('monaco-editor')).toHaveValue(lesson.starterCode)
    expect(screen.getByRole('button', { name: 'Show Solution' })).toBeInTheDocument()
  })

  it('renders the editor container with resize:vertical and the initial height', () => {
    render(<CodeEditor lesson={lesson} />)
    // The Monaco editor is wrapped in a resizable container
    const container = screen.getByTestId('monaco-editor').closest(
      'div[style*="resize"]'
    ) as HTMLElement
    expect(container).not.toBeNull()
    expect(container.style.resize).toBe('vertical')
    expect(container.style.height).toBe('280px')
    expect(container.style.minHeight).toBe('120px')
  })

  it('calls Monaco layout() when the ResizeObserver fires', () => {
    vi.useFakeTimers()
    render(<CodeEditor lesson={lesson} />)
    mockLayout.mockClear()
    expect(resizeObserverCallback).toBeDefined()
    act(() => {
      resizeObserverCallback!([], {} as ResizeObserver)
    })
    // layout() is called inside requestAnimationFrame — flush it
    vi.runAllTimers()
    vi.useRealTimers()
    expect(mockLayout).toHaveBeenCalled()
  })
})
