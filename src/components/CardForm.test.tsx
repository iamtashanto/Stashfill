import { describe, it, expect, vi } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { CardForm } from './CardForm';
import { en } from '../i18n/en';

function fireInput(el: HTMLInputElement | HTMLSelectElement, value: string) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('CardForm Component (Luhn, Brand Detection, Optional CVV)', () => {
  it('shows live Luhn validation and brand detection as the user types', async () => {
    const container = document.createElement('div');
    render(<CardForm t={en} onSave={() => {}} onCancel={() => {}} />, container);

    const cardNumberInput = container.querySelector('#card-number-input') as HTMLInputElement;
    expect(cardNumberInput).not.toBeNull();

    // Enter invalid Visa number
    await act(async () => {
      fireInput(cardNumberInput, '4532015112830367');
    });

    expect(container.textContent).toContain(en.vault.luhnInvalid);
    expect(container.textContent).toContain('VISA');

    // Enter valid Visa number (4532015112830366)
    await act(async () => {
      fireInput(cardNumberInput, '4532015112830366');
    });

    expect(container.textContent).toContain(en.vault.luhnValid);
    expect(container.textContent).toContain('VISA');

    // Enter valid Mastercard prefix
    await act(async () => {
      fireInput(cardNumberInput, '5425233430109903');
    });

    expect(container.textContent).toContain('MASTERCARD');
    expect(container.textContent).toContain(en.vault.luhnValid);
  });

  it('keeps CVV off by default, clearly labels it as not saved, and saves card without CVV unless enabled', async () => {
    const container = document.createElement('div');
    const onSave = vi.fn();
    render(<CardForm t={en} onSave={onSave} onCancel={() => {}} />, container);

    // CVV input should not be rendered initially, and warning should state CVV is NOT saved
    expect(container.querySelector('#card-cvv-input')).toBeNull();
    expect(container.textContent).toContain(en.vault.cvvWarningNotSaved);

    const nicknameInput = container.querySelector('#card-nickname-input') as HTMLInputElement;
    const holderInput = container.querySelector('#card-holder-input') as HTMLInputElement;
    const numberInput = container.querySelector('#card-number-input') as HTMLInputElement;
    const monthSelect = container.querySelector('#card-exp-month') as HTMLSelectElement;
    const yearSelect = container.querySelector('#card-exp-year') as HTMLSelectElement;

    await act(async () => {
      fireInput(nicknameInput, 'Main Visa');
      fireInput(holderInput, 'Ada Lovelace');
      fireInput(numberInput, '4532015112830366');
      fireInput(monthSelect, '09');
      fireInput(yearSelect, '29');
    });

    const form = container.querySelector('form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith({
      id: undefined,
      nickname: 'Main Visa',
      cardholderName: 'Ada Lovelace',
      cardNumber: '4532015112830366',
      expMonth: '09',
      expYear: '29',
      brand: 'visa',
      cvv: undefined,
    });
  });

  it('saves CVV only when the user explicitly toggles saveCvv on', async () => {
    const container = document.createElement('div');
    const onSave = vi.fn();
    render(<CardForm t={en} onSave={onSave} onCancel={() => {}} />, container);

    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    await act(async () => {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const cvvInput = container.querySelector('#card-cvv-input') as HTMLInputElement;
    expect(cvvInput).not.toBeNull();
    expect(container.textContent).toContain(en.vault.cvvWarningSaved);

    const nicknameInput = container.querySelector('#card-nickname-input') as HTMLInputElement;
    const numberInput = container.querySelector('#card-number-input') as HTMLInputElement;

    await act(async () => {
      fireInput(nicknameInput, 'Travel Card');
      fireInput(numberInput, '4532015112830366');
      fireInput(cvvInput, '789');
    });

    const form = container.querySelector('form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave.mock.calls[0]?.[0]?.cvv).toBe('789');
  });
});
