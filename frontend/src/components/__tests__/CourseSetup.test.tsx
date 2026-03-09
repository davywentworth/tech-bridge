import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { CourseSetup } from '../CourseSetup'

describe('CourseSetup', () => {
  it('renders the "I know" and "Teach me" inputs with default values', () => {
    render(<CourseSetup onGenerate={vi.fn()} loading={false} error={null} />)
    expect(screen.getByPlaceholderText('e.g. Redux')).toHaveValue('Redux')
    expect(screen.getByPlaceholderText('e.g. Redux Toolkit')).toHaveValue('Redux Toolkit')
  })

  it('calls onGenerate with the current input values on submit', async () => {
    const user = userEvent.setup()
    const onGenerate = vi.fn()
    render(<CourseSetup onGenerate={onGenerate} loading={false} error={null} />)

    const knownInput = screen.getByPlaceholderText('e.g. Redux')
    const teachInput = screen.getByPlaceholderText('e.g. Redux Toolkit')

    await user.clear(knownInput)
    await user.type(knownInput, 'Vue')
    await user.clear(teachInput)
    await user.type(teachInput, 'React')

    await user.click(screen.getByRole('button', { name: /generate curriculum/i }))
    expect(onGenerate).toHaveBeenCalledWith('Vue', 'React')
  })

  it('trims whitespace from inputs before calling onGenerate', async () => {
    const user = userEvent.setup()
    const onGenerate = vi.fn()
    render(<CourseSetup onGenerate={onGenerate} loading={false} error={null} />)

    const knownInput = screen.getByPlaceholderText('e.g. Redux')
    await user.clear(knownInput)
    await user.type(knownInput, '  MobX  ')

    await user.click(screen.getByRole('button', { name: /generate curriculum/i }))
    expect(onGenerate).toHaveBeenCalledWith('MobX', 'Redux Toolkit')
  })

  it('does not call onGenerate when the "I know" field is whitespace only', async () => {
    const user = userEvent.setup()
    const onGenerate = vi.fn()
    render(<CourseSetup onGenerate={onGenerate} loading={false} error={null} />)

    const knownInput = screen.getByPlaceholderText('e.g. Redux')
    await user.clear(knownInput)
    await user.type(knownInput, '   ')

    await user.click(screen.getByRole('button', { name: /generate curriculum/i }))
    expect(onGenerate).not.toHaveBeenCalled()
  })

  it('does not call onGenerate when the "I know" field is empty', async () => {
    const user = userEvent.setup()
    const onGenerate = vi.fn()
    render(<CourseSetup onGenerate={onGenerate} loading={false} error={null} />)

    await user.clear(screen.getByPlaceholderText('e.g. Redux'))
    await user.click(screen.getByRole('button', { name: /generate curriculum/i }))
    expect(onGenerate).not.toHaveBeenCalled()
  })

  it('does not call onGenerate when the "Teach me" field is empty', async () => {
    const user = userEvent.setup()
    const onGenerate = vi.fn()
    render(<CourseSetup onGenerate={onGenerate} loading={false} error={null} />)

    await user.clear(screen.getByPlaceholderText('e.g. Redux Toolkit'))
    await user.click(screen.getByRole('button', { name: /generate curriculum/i }))
    expect(onGenerate).not.toHaveBeenCalled()
  })

  it('disables the submit button while loading', () => {
    render(<CourseSetup onGenerate={vi.fn()} loading={true} error={null} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows "Generating curriculum…" text on the button while loading', () => {
    render(<CourseSetup onGenerate={vi.fn()} loading={true} error={null} />)
    expect(screen.getByRole('button', { name: /generating curriculum/i })).toBeInTheDocument()
  })

  it('disables both inputs while loading', () => {
    render(<CourseSetup onGenerate={vi.fn()} loading={true} error={null} />)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(2)
    inputs.forEach((input) => expect(input).toBeDisabled())
  })

  it('displays the error message when an error is passed', () => {
    render(<CourseSetup onGenerate={vi.fn()} loading={false} error="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('shows no error message when error is null', () => {
    render(<CourseSetup onGenerate={vi.fn()} loading={false} error={null} />)
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument()
  })
})
