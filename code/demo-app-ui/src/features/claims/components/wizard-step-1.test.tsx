import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useClaimWizardStore } from '../stores/use-claim-wizard-store';
import { WizardStep1 } from './wizard-step-1';

describe('WizardStep1', () => {
  beforeEach(() => {
    // Zustand is shared between renders, so each test starts with a clean wizard.
    useClaimWizardStore.getState().resetWizard();
  });

  it('shows a validation message for a location shorter than five characters', async () => {
    // userEvent reproduces typing and focus changes more closely than direct events.
    const user = userEvent.setup();
    render(<WizardStep1 />);

    // Leaving the invalid field triggers on-change validation and exposes the alert.
    await user.type(screen.getByLabelText(/where did the incident occur/i), 'KL');
    await user.tab();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Location must be at least 5 characters',
    );
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('rejects an incident date in the future', async () => {
    render(<WizardStep1 />);

    // Generate tomorrow dynamically so the test remains valid on every run date.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Date inputs are set with a direct change event because they are browser controls.
    fireEvent.change(screen.getByLabelText(/when did the incident occur/i), {
      target: { value: tomorrow.toISOString().slice(0, 10) },
    });
    fireEvent.blur(screen.getByLabelText(/when did the incident occur/i));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Incident date cannot be in the future',
    );
  });

  it('stores valid incident details and advances to step two', async () => {
    const user = userEvent.setup();
    render(<WizardStep1 />);

    // Fill the form using the same labels visible to a user.
    const today = new Date().toISOString().slice(0, 10);
    fireEvent.change(screen.getByLabelText(/when did the incident occur/i), {
      target: { value: today },
    });
    await user.type(
      screen.getByLabelText(/where did the incident occur/i),
      'Kuala Lumpur',
    );
    await user.type(screen.getByLabelText(/claim amount/i), '1250.50');

    // React Hook Form updates validity asynchronously, so wait before clicking.
    const nextButton = screen.getByRole('button', { name: /next/i });
    await waitFor(() => expect(nextButton).toBeEnabled());
    await user.click(nextButton);

    // Confirm both navigation and persistence in the wizard's shared store.
    await waitFor(() => {
      const state = useClaimWizardStore.getState();
      expect(state.step).toBe(2);
      expect(state.formData.incidentLocation).toBe('Kuala Lumpur');
      expect(state.formData.claimAmount).toBe(1250.5);
    });
  });
});
