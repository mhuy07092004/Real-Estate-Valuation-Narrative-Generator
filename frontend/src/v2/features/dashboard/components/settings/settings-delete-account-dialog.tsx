import { useState } from 'react'

type SettingsDeleteAccountDialogProps = {
  onClose: () => void
}

// There is no backend delete-account endpoint yet (see backend/V2_BACKEND_TODO.md).
// Rather than silently no-op the destructive action (the v1 bug this replaces),
// this dialog walks the user through a real confirmation step and then visibly
// explains — instead of pretending to succeed — why the final action is disabled.
export function SettingsDeleteAccountDialog({ onClose }: SettingsDeleteAccountDialogProps) {
  const [confirmed, setConfirmed] = useState(false)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="delete-account-title" className="text-base font-semibold text-relaive-navy">
          Delete account
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-relaive-gray">
          This permanently removes your profile, reports, and saved data. This action cannot be
          undone.
        </p>

        {!confirmed ? (
          <label className="mt-4 flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-sm text-red-700">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            I understand this will permanently delete my account and all associated data.
          </label>
        ) : (
          <div className="mt-4 rounded-xl bg-amber-50 p-3.5 text-sm text-amber-800">
            Account deletion isn't available yet — please contact support to request account
            deletion in the meantime.
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-relaive-gray transition-colors hover:bg-black/5"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled
            title="Account deletion isn't available yet — contact support"
            className="cursor-not-allowed rounded-xl bg-red-300 px-4 py-2.5 text-sm font-medium text-white opacity-70"
          >
            Delete my account
          </button>
        </div>
      </div>
    </div>
  )
}
