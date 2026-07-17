import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ErrorBoundary } from '../../src/app/ErrorBoundary';

let shouldThrow = true;

function Bomb() {
  if (shouldThrow) throw new Error('kaboom');
  return <p>recovered content</p>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true;
    // React logs caught render errors; keep test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('catches a thrown render error and shows the recovery UI', () => {
    render(
      <ErrorBoundary resetKey="/a">
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /something went wrong/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('kaboom')).toBeInTheDocument();
  });

  it('"Try again" re-renders the children without a reload', () => {
    render(
      <ErrorBoundary resetKey="/a">
        <Bomb />
      </ErrorBoundary>,
    );
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText('recovered content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('clears the error when resetKey changes (route navigation)', () => {
    const { rerender } = render(
      <ErrorBoundary resetKey="/a">
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    shouldThrow = false;
    rerender(
      <ErrorBoundary resetKey="/b">
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('recovered content')).toBeInTheDocument();
  });

  it('renders children normally when nothing throws', () => {
    shouldThrow = false;
    render(
      <ErrorBoundary resetKey="/a">
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('recovered content')).toBeInTheDocument();
  });
});
