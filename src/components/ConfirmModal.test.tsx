import { describe, it, expect, vi } from 'vitest';
import { render } from 'preact';
import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal Component', () => {
  it('does not render when isOpen is false', () => {
    const container = document.createElement('div');
    render(
      <ConfirmModal
        isOpen={false}
        title="Test Title"
        message="Test Message"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
      container,
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders title, message, and buttons when isOpen is true', () => {
    const container = document.createElement('div');
    render(
      <ConfirmModal
        isOpen={true}
        title="Sensitive Card Confirmation"
        message="Are you sure you want to fill this card?"
        confirmLabel="Yes, Fill"
        cancelLabel="No, Cancel"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
      container,
    );

    expect(container.textContent).toContain('Sensitive Card Confirmation');
    expect(container.textContent).toContain('Are you sure you want to fill this card?');
    expect(container.textContent).toContain('Yes, Fill');
    expect(container.textContent).toContain('No, Cancel');
  });

  it('triggers onConfirm when confirm button clicked', () => {
    const container = document.createElement('div');
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        title="Confirm Fill"
        message="Fill now"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
      container,
    );

    const buttons = container.querySelectorAll('button');
    const confirmBtn = buttons[1];
    confirmBtn?.click();

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });
});

