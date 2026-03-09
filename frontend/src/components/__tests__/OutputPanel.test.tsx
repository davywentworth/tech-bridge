import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OutputPanel } from '../OutputPanel';

describe('OutputPanel', () => {
  it('always shows the exit code', () => {
    render(<OutputPanel result={{ stdout: '', stderr: '', exitCode: 0 }} />);
    expect(screen.getByText(/exit code: 0/)).toBeInTheDocument();
  });

  it('shows "No output" when stdout and stderr are both empty', () => {
    render(<OutputPanel result={{ stdout: '', stderr: '', exitCode: 0 }} />);
    expect(screen.getByText('No output')).toBeInTheDocument();
  });

  it('shows stdout when present', () => {
    render(<OutputPanel result={{ stdout: 'hello world', stderr: '', exitCode: 0 }} />);
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('does not show "No output" when there is stdout', () => {
    render(<OutputPanel result={{ stdout: 'hello', stderr: '', exitCode: 0 }} />);
    expect(screen.queryByText('No output')).not.toBeInTheDocument();
  });

  it('shows stderr when present', () => {
    render(<OutputPanel result={{ stdout: '', stderr: 'ReferenceError: x is not defined', exitCode: 1 }} />);
    expect(screen.getByText('ReferenceError: x is not defined')).toBeInTheDocument();
  });

  it('does not show "No output" when there is stderr', () => {
    render(<OutputPanel result={{ stdout: '', stderr: 'oops', exitCode: 1 }} />);
    expect(screen.queryByText('No output')).not.toBeInTheDocument();
  });

  it('shows both stdout and stderr when both are present', () => {
    render(<OutputPanel result={{ stdout: 'out', stderr: 'err', exitCode: 1 }} />);
    expect(screen.getByText('out')).toBeInTheDocument();
    expect(screen.getByText('err')).toBeInTheDocument();
  });

  it('shows non-zero exit code', () => {
    render(<OutputPanel result={{ stdout: '', stderr: '', exitCode: 2 }} />);
    expect(screen.getByText(/exit code: 2/)).toBeInTheDocument();
  });
});
