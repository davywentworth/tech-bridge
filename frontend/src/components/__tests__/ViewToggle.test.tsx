import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ViewToggle } from '../ViewToggle';

describe('ViewToggle', () => {
  it('renders both mode buttons', () => {
    render(<ViewToggle mode="sidebyside" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Side by Side' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sequential' })).toBeInTheDocument();
  });

  it('highlights the currently active mode', () => {
    render(<ViewToggle mode="sidebyside" onChange={vi.fn()} />);
    const sideBySide = screen.getByRole('button', { name: 'Side by Side' });
    const sequential = screen.getByRole('button', { name: 'Sequential' });
    expect(sideBySide).toHaveStyle({ background: '#2563eb' });
    expect(sequential).toHaveStyle({ background: 'transparent' });
  });

  it('highlights sequential when it is the active mode', () => {
    render(<ViewToggle mode="sequential" onChange={vi.fn()} />);
    const sequential = screen.getByRole('button', { name: 'Sequential' });
    expect(sequential).toHaveStyle({ background: '#2563eb' });
  });

  it('calls onChange with "sequential" when that button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ViewToggle mode="sidebyside" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Sequential' }));
    expect(onChange).toHaveBeenCalledWith('sequential');
  });

  it('calls onChange with "sidebyside" when that button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ViewToggle mode="sequential" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Side by Side' }));
    expect(onChange).toHaveBeenCalledWith('sidebyside');
  });
});
