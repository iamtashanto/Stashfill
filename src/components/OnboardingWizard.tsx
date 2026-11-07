import { useState } from 'preact/hooks';
import { type Translations, formatString } from '../i18n';
import { TEMPLATE_REGISTRY } from '../core/templates';

interface OnboardingWizardProps {
  isOpen: boolean;
  t: Translations;
  onComplete: (selectedTemplateIds: string[]) => Promise<void> | void;
  onSkip: () => void;
}

export function OnboardingWizard({ isOpen, t, onComplete, onSkip }: OnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(['personal']);

  if (!isOpen) return null;

  const toggleTemplate = (id: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const getTemplateLabel = (id: string, fallback: string): string => {
    const key = id as keyof typeof t.templates;
    return t.templates[key] || fallback;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onSkip();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      onKeyDown={handleKeyDown}
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
    >
      <div class="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div class="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
          <div>
            <h2
              id="onboarding-title"
              class="text-base font-bold text-slate-900 dark:text-slate-100"
            >
              {t.onboarding.welcomeTitle}
            </h2>
            <p class="text-xs text-slate-600 dark:text-slate-300">{t.onboarding.welcomeSubtitle}</p>
          </div>
          <span class="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200">
            {formatString(t.onboarding.stepIndicator, { current: step, total: 3 })}
          </span>
        </div>

        <div class="py-5">
          {step === 1 && (
            <div class="space-y-4">
              <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.onboarding.step1Title}
              </h3>
              <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {t.onboarding.step1Desc}
              </p>
              <ul class="space-y-2 rounded-lg bg-slate-50 p-3.5 text-xs text-slate-800 dark:bg-slate-800/60 dark:text-slate-200">
                <li class="flex items-center gap-2">
                  <span class="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true"></span>
                  <span>{t.onboarding.step1Bullet1}</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true"></span>
                  <span>{t.onboarding.step1Bullet2}</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true"></span>
                  <span>{t.onboarding.step1Bullet3}</span>
                </li>
              </ul>
            </div>
          )}

          {step === 2 && (
            <div class="space-y-3">
              <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.onboarding.step2Title}
              </h3>
              <p class="text-xs text-slate-700 dark:text-slate-300">{t.onboarding.step2Desc}</p>
              <div
                role="group"
                aria-label={t.onboarding.step2Title}
                class="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pe-1 sm:grid-cols-2"
              >
                {TEMPLATE_REGISTRY.map((tpl) => {
                  const isSelected = selectedTemplates.includes(tpl.id);
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleTemplate(tpl.id)}
                      class={`flex items-center justify-between rounded-lg border px-3 py-2 text-start text-xs font-medium transition-colors ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50 text-brand-900 dark:border-brand-400 dark:bg-brand-950/70 dark:text-brand-100'
                          : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span>{getTemplateLabel(tpl.id, tpl.label)}</span>
                      <span
                        class={`ms-2 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                          isSelected
                            ? 'bg-brand-600 text-white'
                            : 'border border-slate-400 text-transparent'
                        }`}
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>
              <p class="text-[11px] text-slate-600 dark:text-slate-300">
                {t.onboarding.selectTemplatesHint}
              </p>
            </div>
          )}

          {step === 3 && (
            <div class="space-y-4">
              <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.onboarding.step3Title}
              </h3>
              <p class="text-xs text-slate-700 dark:text-slate-300">{t.onboarding.step3Desc}</p>
              <div class="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                <div class="flex items-center justify-between">
                  <span>{t.onboarding.shortcutSearch}</span>
                  <kbd class="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[11px] dark:border-slate-600 dark:bg-slate-900">
                    /
                  </kbd>
                </div>
                <div class="flex items-center justify-between">
                  <span>{t.onboarding.shortcutNav}</span>
                  <kbd class="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[11px] dark:border-slate-600 dark:bg-slate-900">
                    ↑ / ↓
                  </kbd>
                </div>
                <div class="flex items-center justify-between">
                  <span>{t.onboarding.shortcutFill}</span>
                  <kbd class="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[11px] dark:border-slate-600 dark:bg-slate-900">
                    Enter
                  </kbd>
                </div>
                <div class="flex items-center justify-between">
                  <span>{t.onboarding.shortcutEsc}</span>
                  <kbd class="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[11px] dark:border-slate-600 dark:bg-slate-900">
                    Esc
                  </kbd>
                </div>
              </div>
            </div>
          )}
        </div>

        <div class="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onSkip}
            class="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t.actions.skip}
          </button>

          <div class="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev === 3 ? 2 : 1))}
                class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              >
                {t.actions.back}
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev === 1 ? 2 : 3))}
                class="rounded-md bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
              >
                {t.actions.next}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onComplete(selectedTemplates)}
                class="rounded-md bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
              >
                {t.actions.finish}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
