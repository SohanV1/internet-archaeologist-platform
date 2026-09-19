import React from 'react';
import { render, screen } from '@testing-library/react';
import { SkeletonLoader } from '@/components/SkeletonLoader';

describe('SkeletonLoader Component', () => {
  it('renders default card skeleton loader', () => {
    const { container } = render(<SkeletonLoader type="card" />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('renders graph skeleton with hydration text', () => {
    render(<SkeletonLoader type="graph" />);
    expect(screen.getByText(/Hydrating Interactive Topology/i)).toBeInTheDocument();
  });

  it('renders table skeleton rows', () => {
    const { container } = render(<SkeletonLoader type="table" />);
    const rows = container.querySelectorAll('.bg-slate-950\\/60');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('renders overview skeleton with metric cards', () => {
    const { container } = render(<SkeletonLoader type="overview" />);
    const cards = container.querySelectorAll('.bg-slate-950\\/60');
    expect(cards.length).toBe(4);
  });

  it('renders matrix skeleton layout', () => {
    const { container } = render(<SkeletonLoader type="matrix" />);
    const gridCols = container.querySelectorAll('.grid-cols-5');
    expect(gridCols.length).toBe(1);
  });
});
