import { useEffect, useRef } from 'preact/hooks';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCancel();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onKeyDown={handleKeyDown}
      class="backdrop-blur-xs animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 duration-100"
    >
      <div class="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 text-left shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <h3
          id="confirm-modal-title"
          class="text-sm font-semibold text-slate-900 dark:text-slate-100"
        >
          {title}
        </h3>
        <p class="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{message}</p>
        <div class="mt-5 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            class="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            class={`rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors ${
              isDestructive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
