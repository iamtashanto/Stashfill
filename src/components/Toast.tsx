export interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'info' | 'error';
}

export function Toast({ toast, onClose }: { toast: ToastMessage | null; onClose: () => void }) {
  if (!toast) return null;

  const bg =
    toast.type === 'error'
      ? 'bg-rose-600 text-white'
      : toast.type === 'info'
        ? 'bg-sky-600 text-white'
        : 'bg-emerald-600 text-white';

  return (
    <div
      role="status"
      aria-live="polite"
      class={`fixed bottom-3 left-1/2 z-50 flex -translate-x-1/2 items-center space-x-2 rounded-md px-3 py-1.5 text-xs font-medium shadow-lg transition-all duration-150 ${bg}`}
    >
      <span>{toast.text}</span>
      <button
        type="button"
        onClick={onClose}
        class="ml-1 text-xs font-bold leading-none opacity-75 hover:opacity-100"
        aria-label="Dismiss toast"
      >
        ×
      </button>
    </div>
  );
}
