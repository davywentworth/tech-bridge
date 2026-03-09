import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeEditor } from '../CodeEditor';
import type { Lesson } from '../../types';

vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock('../../api/execute', () => ({
  runCode: vi.fn(),
}));

import { runCode } from '../../api/execute';
const mockRunCode = vi.mocked(runCode);

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
};

describe('CodeEditor', () => {
  beforeEach(() => {
    mockRunCode.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('displays the lesson language label', () => {
    render(<CodeEditor lesson={lesson} />);
    expect(screen.getByText('javascript')).toBeInTheDocument();
  });

  it('loads the editor with the starter code', () => {
    render(<CodeEditor lesson={lesson} />);
    expect(screen.getByTestId('monaco-editor')).toHaveValue('// starter');
  });

  it('shows the "Show Solution" button initially', () => {
    render(<CodeEditor lesson={lesson} />);
    expect(screen.getByRole('button', { name: 'Show Solution' })).toBeInTheDocument();
  });

  it('shows the Run button initially', () => {
    render(<CodeEditor lesson={lesson} />);
    expect(screen.getByRole('button', { name: '▶ Run' })).toBeInTheDocument();
  });

  it('replaces editor content with solution code when "Show Solution" is clicked', async () => {
    render(<CodeEditor lesson={lesson} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show Solution' }));
    expect(screen.getByTestId('monaco-editor')).toHaveValue('// solution');
  });

  it('hides the "Show Solution" button after it is clicked', async () => {
    render(<CodeEditor lesson={lesson} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show Solution' }));
    expect(screen.queryByRole('button', { name: 'Show Solution' })).not.toBeInTheDocument();
  });

  it('calls runCode with the current code and lesson details when Run is clicked', async () => {
    render(<CodeEditor lesson={lesson} />);
    await userEvent.click(screen.getByRole('button', { name: '▶ Run' }));
    expect(mockRunCode).toHaveBeenCalledWith('// starter', 'javascript', 'createSlice basics');
  });

  it('runs the code the user typed rather than the original starter code', async () => {
    render(<CodeEditor lesson={lesson} />);
    await userEvent.clear(screen.getByTestId('monaco-editor'));
    await userEvent.type(screen.getByTestId('monaco-editor'), 'console.log(42)');
    await userEvent.click(screen.getByRole('button', { name: '▶ Run' }));
    expect(mockRunCode).toHaveBeenCalledWith('console.log(42)', 'javascript', 'createSlice basics');
  });

  it('disables the Run button while code is executing', async () => {
    let resolve: (val: { stdout: string; stderr: string; exitCode: number }) => void;
    mockRunCode.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<CodeEditor lesson={lesson} />);
    await userEvent.click(screen.getByRole('button', { name: '▶ Run' }));
    expect(screen.getByRole('button', { name: 'Running…' })).toBeDisabled();
    await act(async () => { resolve({ stdout: '', stderr: '', exitCode: 0 }); });
  });

  it('shows output panel with stdout after a successful run', async () => {
    mockRunCode.mockResolvedValue({ stdout: 'hello', stderr: '', exitCode: 0 });
    render(<CodeEditor lesson={lesson} />);
    await userEvent.click(screen.getByRole('button', { name: '▶ Run' }));
    await waitFor(() => expect(screen.getByText('hello')).toBeInTheDocument());
  });

  it('shows output panel with stderr when execution fails', async () => {
    mockRunCode.mockResolvedValue({ stdout: '', stderr: 'ReferenceError: x is not defined', exitCode: 1 });
    render(<CodeEditor lesson={lesson} />);
    await userEvent.click(screen.getByRole('button', { name: '▶ Run' }));
    await waitFor(() => expect(screen.getByText('ReferenceError: x is not defined')).toBeInTheDocument());
  });

  it('shows a caught error in the output panel if runCode throws', async () => {
    mockRunCode.mockRejectedValue(new Error('Network error'));
    render(<CodeEditor lesson={lesson} />);
    await userEvent.click(screen.getByRole('button', { name: '▶ Run' }));
    await waitFor(() => expect(screen.getByText('Error: Network error')).toBeInTheDocument());
  });

  it('re-enables the Run button after execution completes', async () => {
    render(<CodeEditor lesson={lesson} />);
    await userEvent.click(screen.getByRole('button', { name: '▶ Run' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '▶ Run' })).not.toBeDisabled());
  });

  it('runs the solution code (not the starter) after clicking Show Solution then Run', async () => {
    render(<CodeEditor lesson={lesson} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show Solution' }));
    await userEvent.click(screen.getByRole('button', { name: '▶ Run' }));
    expect(mockRunCode).toHaveBeenCalledWith('// solution', 'javascript', 'createSlice basics');
  });
});
