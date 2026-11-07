import { describe, it, expect, vi } from 'vitest';
import { render } from 'preact';
import { StashItemRow } from './StashItemRow';

describe('StashItemRow Component', () => {
  it('renders field label and value', () => {
    const container = document.createElement('div');
    render(
      <StashItemRow
        label="Email Address"
        value="john@doe.com"
        onFill={() => {}}
        onCopy={() => {}}
      />,
      container,
    );

    expect(container.textContent).toContain('Email Address');
    expect(container.textContent).toContain('john@doe.com');
  });

  it('triggers onFill when Fill button is clicked', () => {
    const container = document.createElement('div');
    const onFill = vi.fn();
    const onCopy = vi.fn();

    render(
      <StashItemRow
        label="Full Name"
        value="Ada Lovelace"
        fillLabel="Fill"
        copyLabel="Copy"
        onFill={onFill}
        onCopy={onCopy}
      />,
      container,
    );

    const fillBtn = container.querySelector('button[title="Fill"]') as HTMLButtonElement;
    fillBtn?.click();

    expect(onFill).toHaveBeenCalledOnce();
    expect(onCopy).not.toHaveBeenCalled();
  });

  it('triggers onCopy when Copy button is clicked', () => {
    const container = document.createElement('div');
    const onFill = vi.fn();
    const onCopy = vi.fn();

    render(
      <StashItemRow
        label="Full Name"
        value="Ada Lovelace"
        fillLabel="Fill"
        copyLabel="Copy"
        onFill={onFill}
        onCopy={onCopy}
      />,
      container,
    );

    const copyBtn = container.querySelector('button[title="Copy"]') as HTMLButtonElement;
    copyBtn?.click();

    expect(onCopy).toHaveBeenCalledOnce();
    expect(onFill).not.toHaveBeenCalled();
  });

  it('does not render if value is empty', () => {
    const container = document.createElement('div');
    render(
      <StashItemRow label="Empty Field" value="" onFill={() => {}} onCopy={() => {}} />,
      container,
    );

    expect(container.innerHTML).toBe('');
  });
});
