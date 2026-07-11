function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M20 20L16.5 16.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ZoomInIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M20 20L16.5 16.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M11 8V14M8 11H14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ZoomOutIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M20 20L16.5 16.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M8 11H14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ExpandIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 4H4V9M15 4H20V9M9 20H4V15M15 20H20V15"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 12A8 8 0 0 1 19.5 8.5M20 12A8 8 0 0 1 4.5 15.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M19.5 4.5V8.5H15.5M4.5 19.5V15.5H8.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const MAP_CONTROLS = [
  { label: 'Zoom in', icon: <ZoomInIcon /> },
  { label: 'Zoom out', icon: <ZoomOutIcon /> },
  { label: 'Expand map', icon: <ExpandIcon /> },
  { label: 'Reset map', icon: <ResetIcon /> },
] as const

export function MapCard() {
  return (
    <div
      className="relative aspect-[16/9] min-h-[420px] w-full overflow-hidden rounded-3xl bg-slate-100 shadow-[0_4px_24px_rgba(26,32,44,0.06)]"
      aria-label="Property intelligence map placeholder"
    >
      <div className="absolute inset-x-0 top-0 z-10 flex justify-center px-6 pt-6">
        <label className="relative flex w-full max-w-md items-center">
          <span className="sr-only">Property address</span>
          <input
            type="text"
            placeholder="Enter property address"
            className="w-full rounded-full border border-black/5 bg-white py-3 pl-5 pr-12 text-sm text-relaive-navy shadow-[0_2px_12px_rgba(26,32,44,0.08)] placeholder:text-relaive-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
            readOnly
          />
          <span className="pointer-events-none absolute right-4 text-relaive-gray">
            <SearchIcon />
          </span>
        </label>
      </div>

      <div className="absolute right-5 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2.5">
        {MAP_CONTROLS.map(({ label, icon }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-relaive-navy shadow-[0_2px_10px_rgba(26,32,44,0.08)] transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  )
}
