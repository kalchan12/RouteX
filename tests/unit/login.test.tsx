import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { LoginPortal } from '../../src/components/auth/LoginPortal';
import { useSimulationStore } from '../../src/stores';

describe('LoginPortal Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useSimulationStore.setState({ isAuthenticated: false });
  });

  it('renders login credentials form by default', () => {
    render(<LoginPortal />);
    expect(screen.getByText(/ADAMA MUNICIPAL DISPATCH PORTAL/i)).toBeDefined();
    expect(screen.getByDisplayValue('RX-8842')).toBeDefined();
    expect(screen.getByRole('button', { name: /Authorize/i })).toBeDefined();
  });

  it('initiates boot sequence on submit and transitions to authenticated state without freezing', () => {
    const onLoginSuccess = vi.fn();
    render(<LoginPortal onLoginSuccess={onLoginSuccess} />);

    const submitBtn = screen.getByRole('button', { name: /Authorize/i });
    fireEvent.click(submitBtn);

    // Should switch to holographic bootup screen
    expect(screen.getByText(/AUTHENTICATING ACCESS CLEARANCE/i)).toBeDefined();
    expect(screen.getByText(/WELCOME, OPERATOR #RX-8842/i)).toBeDefined();

    // Fast-forward timers through the boot sequence (1800ms)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(useSimulationStore.getState().isAuthenticated).toBe(true);
    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
  });

  it('allows instant bypass when clicking Skip Sequence', () => {
    const onLoginSuccess = vi.fn();
    render(<LoginPortal onLoginSuccess={onLoginSuccess} />);

    fireEvent.click(screen.getByRole('button', { name: /Authorize/i }));
    expect(screen.getByText(/Skip Sequence/i)).toBeDefined();

    fireEvent.click(screen.getByText(/Skip Sequence/i));
    expect(useSimulationStore.getState().isAuthenticated).toBe(true);
    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
  });
});
