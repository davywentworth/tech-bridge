import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CourseSetup } from '../CourseSetup';

describe('CourseSetup', () => {
  it('renders the "I know" and "Teach me" inputs with default values', () => {
    render(<CourseSetup onGenerate={vi.fn()} loading={false} error={null} />);
    expect(screen.getByPlaceholderText('e.g. Redux')).toHaveValue('Redux');
    expect(screen.getByPlaceholderText('e.g. Redux Toolkit')).toHaveValue('Redux Toolkit');
  });

  it('calls onGenerate with the current input values on submit', async () => {
    const onGenerate = vi.fn();
    render(<CourseSetup onGenerate={onGenerate} loading={false} error={null} />);

    const knownInput = screen.getByPlaceholderText('e.g. Redux');
    const teachInput = screen.getByPlaceholderText('e.g. Redux Toolkit');

    await userEvent.clear(knownInput);
    await userEvent.type(knownInput, 'Vue');
    await userEvent.clear(teachInput);
    await userEvent.type(teachInput, 'React');

    await userEvent.click(screen.getByRole('button', { name: /generate curriculum/i }));
    expect(onGenerate).toHaveBeenCalledWith('Vue', 'React');
  });

  it('trims whitespace from inputs before calling onGenerate', async () => {
    const onGenerate = vi.fn();
    render(<CourseSetup onGenerate={onGenerate} loading={false} error={null} />);

    const knownInput = screen.getByPlaceholderText('e.g. Redux');
    await userEvent.clear(knownInput);
    await userEvent.type(knownInput, '  MobX  ');

    await userEvent.click(screen.getByRole('button', { name: /generate curriculum/i }));
    expect(onGenerate).toHaveBeenCalledWith('MobX', 'Redux Toolkit');
  });

  it('does not call onGenerate when the "I know" field is whitespace only', async () => {
    const onGenerate = vi.fn();
    render(<CourseSetup onGenerate={onGenerate} loading={false} error={null} />);

    const knownInput = screen.getByPlaceholderText('e.g. Redux');
    await userEvent.clear(knownInput);
    await userEvent.type(knownInput, '   ');

    await userEvent.click(screen.getByRole('button', { name: /generate curriculum/i }));
    expect(onGenerate).not.toHaveBeenCalled();
  });

  it('does not call onGenerate when the "I know" field is empty', async () => {
    const onGenerate = vi.fn();
    render(<CourseSetup onGenerate={onGenerate} loading={false} error={null} />);

    await userEvent.clear(screen.getByPlaceholderText('e.g. Redux'));
    await userEvent.click(screen.getByRole('button', { name: /generate curriculum/i }));
    expect(onGenerate).not.toHaveBeenCalled();
  });

  it('does not call onGenerate when the "Teach me" field is empty', async () => {
    const onGenerate = vi.fn();
    render(<CourseSetup onGenerate={onGenerate} loading={false} error={null} />);

    await userEvent.clear(screen.getByPlaceholderText('e.g. Redux Toolkit'));
    await userEvent.click(screen.getByRole('button', { name: /generate curriculum/i }));
    expect(onGenerate).not.toHaveBeenCalled();
  });

  it('disables the submit button while loading', () => {
    render(<CourseSetup onGenerate={vi.fn()} loading={true} error={null} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows "Generating curriculum…" text on the button while loading', () => {
    render(<CourseSetup onGenerate={vi.fn()} loading={true} error={null} />);
    expect(screen.getByRole('button', { name: /generating curriculum/i })).toBeInTheDocument();
  });

  it('disables inputs while loading', () => {
    render(<CourseSetup onGenerate={vi.fn()} loading={true} error={null} />);
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input) => expect(input).toBeDisabled());
  });

  it('displays the error message when an error is passed', () => {
    render(<CourseSetup onGenerate={vi.fn()} loading={false} error="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows no error message when error is null', () => {
    render(<CourseSetup onGenerate={vi.fn()} loading={false} error={null} />);
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });
});
