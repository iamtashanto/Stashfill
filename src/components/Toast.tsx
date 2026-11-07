export interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'info' | 'error';
}

export function Toast({
  toast,
  onClose,
  closeLabel = 'Close',
}: {
  toast: ToastMessage | null;
  onClose: () => void;
  closeLabel?: string;
}) {
  const bg =
    toast?.type === 'error'
      ? 'bg-rose-700 text-white'
      : toast?.type === 'info'
        ? 'bg-sky-700 text-white'
        : 'bg-emerald-700 text-white';

  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {toast && (
        <div
          class={`fixed bottom-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium shadow-lg transition-all duration-150 ${bg}`}
        >
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={onClose}
            class="ms-1 rounded px-1 text-xs font-bold leading-none text-white opacity-90 hover:opacity-100"
            aria-label={closeLabel}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
