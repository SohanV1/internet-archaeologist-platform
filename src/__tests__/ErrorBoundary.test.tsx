import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const FaultyComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Simulated forensic rendering failure');
  }
  return <div>Component Rendered Successfully</div>;
};

describe('ErrorBoundary Component', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <FaultyComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Component Rendered Successfully')).toBeInTheDocument();
  });

  it('catches render errors and displays fallback card with retry button', () => {
    render(
      <ErrorBoundary>
        <FaultyComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Forensic Component Error')).toBeInTheDocument();
    expect(
      screen.getByText(/A component encountered a runtime rendering exception/)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('renders custom fallback title and message when provided', () => {
    render(
      <ErrorBoundary fallbackTitle="Custom Module Error" fallbackMessage="Custom error details">
        <FaultyComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Module Error')).toBeInTheDocument();
    expect(screen.getByText('Custom error details')).toBeInTheDocument();
  });

  it('invokes onReset handler when retry button is clicked', () => {
    const handleReset = jest.fn();
    render(
      <ErrorBoundary onReset={handleReset}>
        <FaultyComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);

    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
