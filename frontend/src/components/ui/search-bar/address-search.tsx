type AddressSearchProps = {
  placeholder?: string
  className?: string
}

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

export function AddressSearch({
  placeholder = 'Enter property address',
  className = '',
}: AddressSearchProps) {
  return (
    <label className={`relative flex w-full max-w-md items-center ${className}`}>
      <span className="sr-only">Property address</span>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full rounded-full border border-black/5 bg-white py-3 pl-5 pr-12 text-sm text-relaive-navy shadow-[0_2px_12px_rgba(26,32,44,0.08)] placeholder:text-relaive-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
        readOnly
      />
      <span className="pointer-events-none absolute right-4 text-relaive-gray">
        <SearchIcon />
      </span>
    </label>
  )
}
