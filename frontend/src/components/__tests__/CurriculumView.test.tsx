import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CurriculumView } from '../CurriculumView';
import type { Curriculum } from '../../types';

const curriculum: Curriculum = {
  id: 'c1',
  knownTech: 'Redux',
  targetTech: 'Redux Toolkit',
  description: 'Migrate from Redux to Redux Toolkit.',
  modules: [
    {
      id: 'm1',
      title: 'Getting Started',
      lessons: [
        { id: 'l1', title: 'Setup' },
        { id: 'l2', title: 'createSlice' },
      ],
    },
    {
      id: 'm2',
      title: 'Advanced',
      lessons: [{ id: 'l3', title: 'RTK Query' }],
    },
  ],
};

describe('CurriculumView', () => {
  it('renders the known and target tech in the header', () => {
    render(
      <CurriculumView
        curriculum={curriculum}
        completedLessonIds={[]}
        onSelectLesson={vi.fn()}
      />
    );
    expect(screen.getByText('Redux → Redux Toolkit')).toBeInTheDocument();
  });

  it('renders the curriculum description', () => {
    render(
      <CurriculumView
        curriculum={curriculum}
        completedLessonIds={[]}
        onSelectLesson={vi.fn()}
      />
    );
    expect(screen.getByText('Migrate from Redux to Redux Toolkit.')).toBeInTheDocument();
  });

  it('renders all module titles', () => {
    render(
      <CurriculumView
        curriculum={curriculum}
        completedLessonIds={[]}
        onSelectLesson={vi.fn()}
      />
    );
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('renders all lesson titles as buttons', () => {
    render(
      <CurriculumView
        curriculum={curriculum}
        completedLessonIds={[]}
        onSelectLesson={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /setup/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /createslice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rtk query/i })).toBeInTheDocument();
  });

  it('shows ○ for incomplete lessons', () => {
    render(
      <CurriculumView
        curriculum={curriculum}
        completedLessonIds={[]}
        onSelectLesson={vi.fn()}
      />
    );
    const incompleteMarkers = screen.getAllByText('○');
    expect(incompleteMarkers).toHaveLength(3);
  });

  it('shows ✓ for completed lessons', () => {
    render(
      <CurriculumView
        curriculum={curriculum}
        completedLessonIds={['l1', 'l3']}
        onSelectLesson={vi.fn()}
      />
    );
    expect(screen.getAllByText('✓')).toHaveLength(2);
    expect(screen.getAllByText('○')).toHaveLength(1);
  });

  it('calls onSelectLesson with the correct module id, lesson id and title when a lesson is clicked', async () => {
    const user = userEvent.setup();
    const onSelectLesson = vi.fn();
    render(
      <CurriculumView
        curriculum={curriculum}
        completedLessonIds={[]}
        onSelectLesson={onSelectLesson}
      />
    );
    await user.click(screen.getByRole('button', { name: /createslice/i }));
    expect(onSelectLesson).toHaveBeenCalledWith('m1', 'l2', 'createSlice');
  });

  it('applies active styling to the current lesson', () => {
    render(
      <CurriculumView
        curriculum={curriculum}
        currentLessonId="l2"
        completedLessonIds={[]}
        onSelectLesson={vi.fn()}
      />
    );
    const activeButton = screen.getByRole('button', { name: /createslice/i });
    expect(activeButton).toHaveStyle({ background: '#eff6ff' });
  });

  it('does not apply active styling to non-current lessons', () => {
    render(
      <CurriculumView
        curriculum={curriculum}
        currentLessonId="l2"
        completedLessonIds={[]}
        onSelectLesson={vi.fn()}
      />
    );
    const inactiveButton = screen.getByRole('button', { name: /setup/i });
    expect(inactiveButton).toHaveStyle({ background: 'transparent' });
  });

  it('renders correctly when there are no modules', () => {
    const emptyCurriculum = { ...curriculum, modules: [] };
    render(
      <CurriculumView
        curriculum={emptyCurriculum}
        completedLessonIds={[]}
        onSelectLesson={vi.fn()}
      />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders the module title even when the module has no lessons', () => {
    const noLessonsCurriculum = {
      ...curriculum,
      modules: [{ id: 'm1', title: 'Empty Module', lessons: [] }],
    };
    render(
      <CurriculumView
        curriculum={noLessonsCurriculum}
        completedLessonIds={[]}
        onSelectLesson={vi.fn()}
      />
    );
    expect(screen.getByText('Empty Module')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
