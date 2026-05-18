export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  busy = false,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded bg-white p-4 shadow-lg">
        <h3 className="text-lg font-semibold text-navy">{title}</h3>
        <p className="mt-2 text-sm text-slate-700">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} disabled={busy} className="rounded border px-3 py-2">
            {cancelText}
          </button>
          <button onClick={onConfirm} disabled={busy} className="rounded bg-navy px-3 py-2 text-white">
            {busy ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
