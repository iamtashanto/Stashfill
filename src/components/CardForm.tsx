import { useState, useMemo } from 'preact/hooks';
import { validateLuhn, detectCardBrand } from '../core/luhn';
import { type Translations, formatString } from '../i18n';
import { CardBrandIcon } from './CardBrandIcon';
import type { PaymentCard } from '../types/vault';

interface CardFormProps {
  t: Translations;
  initialCard?: PaymentCard | null;
  onSave: (
    cardData: Omit<PaymentCard, 'id' | 'createdAt'> & { id?: string },
  ) => Promise<void> | void;
  onCancel: () => void;
}

const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const YEARS = Array.from({ length: 15 }, (_, i) => String(26 + i));

export function CardForm({ t, initialCard, onSave, onCancel }: CardFormProps) {
  const [nickname, setNickname] = useState(initialCard?.nickname ?? '');
  const [cardholderName, setCardholderName] = useState(initialCard?.cardholderName ?? '');
  const [cardNumber, setCardNumber] = useState(initialCard?.cardNumber ?? '');
  const [expMonth, setExpMonth] = useState(initialCard?.expMonth ?? '01');
  const [expYear, setExpYear] = useState(initialCard?.expYear ?? '28');
  const [saveCvv, setSaveCvv] = useState(Boolean(initialCard?.cvv));
  const [cvv, setCvv] = useState(initialCard?.cvv ?? '');
  const [formError, setFormError] = useState('');

  const cleanedDigits = useMemo(() => cardNumber.replace(/\D/g, ''), [cardNumber]);
  const detectedBrand = useMemo(() => detectCardBrand(cleanedDigits), [cleanedDigits]);
  const isLuhnValid = useMemo(
    () => cleanedDigits.length >= 12 && validateLuhn(cleanedDigits),
    [cleanedDigits],
  );

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setFormError('');

    if (!nickname.trim() || !cleanedDigits) {
      setFormError(t.messages.requiredCardFields);
      return;
    }

    if (!isLuhnValid) {
      setFormError(t.vault.luhnInvalid);
      return;
    }

    if (saveCvv && (!cvv.trim() || cvv.trim().length < 3)) {
      setFormError(t.messages.requiredCardFields);
      return;
    }

    await onSave({
      id: initialCard?.id,
      nickname: nickname.trim(),
      cardholderName: cardholderName.trim(),
      cardNumber: cleanedDigits,
      expMonth,
      expYear,
      brand: detectedBrand,
      cvv: saveCvv && cvv.trim() ? cvv.trim() : undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={initialCard ? t.vault.editCard : t.vault.addCard}
      class="space-y-4 rounded-lg border border-brand-300 bg-brand-50/40 p-4 dark:border-brand-800 dark:bg-brand-950/30"
    >
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
          {initialCard ? t.vault.editCard : t.vault.addCard}
        </h3>
        <CardBrandIcon brand={detectedBrand} />
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label
            for="card-nickname-input"
            class="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            {t.fields.nickname} *
          </label>
          <input
            id="card-nickname-input"
            type="text"
            required
            value={nickname}
            onInput={(e) => setNickname((e.target as HTMLInputElement).value)}
            placeholder={t.vault.nicknamePlaceholder}
            class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label
            for="card-holder-input"
            class="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            {t.fields.cardholderName}
          </label>
          <input
            id="card-holder-input"
            type="text"
            value={cardholderName}
            onInput={(e) => setCardholderName((e.target as HTMLInputElement).value)}
            placeholder={t.vault.cardholderPlaceholder}
            class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div class="sm:col-span-2">
          <div class="mb-1 flex items-center justify-between">
            <label
              for="card-number-input"
              class="text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              {t.fields.cardNumber} *
            </label>
            {cleanedDigits.length > 0 && (
              <span
                role="status"
                aria-live="polite"
                class={`text-[11px] font-semibold ${
                  isLuhnValid
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {isLuhnValid ? t.vault.luhnValid : t.vault.luhnInvalid}
              </span>
            )}
          </div>
          <div class="flex items-center gap-2">
            <input
              id="card-number-input"
              type="text"
              inputMode="numeric"
              required
              value={cardNumber}
              onInput={(e) => setCardNumber((e.target as HTMLInputElement).value)}
              placeholder={t.vault.cardNumberPlaceholder}
              class="flex-1 rounded-md border border-slate-300 bg-white p-2 font-mono text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <span class="text-xs font-medium text-slate-700 dark:text-slate-300">
              {formatString(t.vault.detectedBrand, { brand: detectedBrand.toUpperCase() })}
            </span>
          </div>
        </div>

        <div>
          <label
            for="card-exp-month"
            class="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            {t.fields.expiry} *
          </label>
          <div class="flex items-center gap-2">
            <select
              id="card-exp-month"
              aria-label={t.fields.expMonth}
              value={expMonth}
              onChange={(e) => setExpMonth((e.target as HTMLSelectElement).value)}
              class="w-24 rounded-md border border-slate-300 bg-white p-2 font-mono text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <span class="text-xs font-bold text-slate-600 dark:text-slate-300">/</span>
            <select
              id="card-exp-year"
              aria-label={t.fields.expYear}
              value={expYear}
              onChange={(e) => setExpYear((e.target as HTMLSelectElement).value)}
              class="w-24 rounded-md border border-slate-300 bg-white p-2 font-mono text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div class="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-800/60 sm:col-span-2">
          <label class="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <input
              type="checkbox"
              checked={saveCvv}
              onChange={(e) => {
                const checked = (e.target as HTMLInputElement).checked;
                setSaveCvv(checked);
                if (!checked) setCvv('');
              }}
              class="rounded border-slate-300 text-brand-600"
            />
            <span>{t.vault.saveCvvToggle}</span>
          </label>
          <p class="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
            {saveCvv ? t.vault.cvvWarningSaved : t.vault.cvvWarningNotSaved}
          </p>

          {saveCvv && (
            <div class="mt-2">
              <label
                for="card-cvv-input"
                class="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200"
              >
                {t.fields.cvv}
              </label>
              <input
                id="card-cvv-input"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={cvv}
                onInput={(e) => setCvv((e.target as HTMLInputElement).value)}
                placeholder={t.vault.cvvPlaceholder}
                class="w-28 rounded-md border border-slate-300 bg-white p-2 text-center font-mono text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          )}
        </div>
      </div>

      {formError && (
        <p role="alert" class="text-xs font-medium text-rose-700 dark:text-rose-400">
          {formError}
        </p>
      )}

      <div class="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {t.actions.cancel}
        </button>
        <button
          type="submit"
          class="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
        >
          {t.actions.save}
        </button>
      </div>
    </form>
  );
}
