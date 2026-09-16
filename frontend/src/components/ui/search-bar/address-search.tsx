import type { KeyboardEventHandler } from 'react'

type AddressSearchProps = {
  placeholder?: string
  className?: string
  inputClassName?: string
  readOnly?: boolean
  iconPosition?: 'left' | 'right'
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>
  id?: string
  name?: string
  /**
   * Optional — when provided, the input becomes interactive and calls
   * this with the typed value on Enter. When omitted, the input stays
   * read-only exactly as before, so existing usages are unaffected.
   */
  onSearch?: (value: string) => void
}

export function SearchIcon() {
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
  inputClassName = '',
  readOnly,
  iconPosition = 'right',
  value,
  defaultValue,
  onChange,
  onKeyDown,
  id,
  name,
  onSearch,
}: AddressSearchProps) {
  const interactive = Boolean(onSearch)
  // Explicit `readOnly` wins when passed; otherwise the field becomes
  // editable automatically once an `onSearch` handler is provided, and
  // stays read-only (the original default) when neither is given.
  const resolvedReadOnly = readOnly ?? !interactive

  return (
    <label className={`relative flex w-full max-w-md items-center ${className}`}>
      <span className="sr-only">Property address</span>
      {iconPosition === 'left' ? (
        interactive ? (
          <button
            type="button"
            aria-label="Search"
            onClick={() => onSearch?.(value ?? '')}
            className="absolute left-4 text-relaive-gray transition-colors hover:text-relaive-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary rounded-full"
          >
            <SearchIcon />
          </button>
        ) : (
          <span className="pointer-events-none absolute left-4 text-relaive-gray">
            <SearchIcon />
          </span>
        )
      ) : null}
      <input
        id={id}
        name={name}
        type="text"
        placeholder={placeholder}
        readOnly={resolvedReadOnly}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        onKeyDown={
          onKeyDown ??
          (interactive
            ? (event) => {
                if (event.key === 'Enter') onSearch?.(value ?? '')
              }
            : undefined)
        }
        className={`w-full rounded-full border border-black/5 bg-white py-3 text-sm text-relaive-navy shadow-[0_2px_12px_rgba(26,32,44,0.08)] placeholder:text-relaive-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary ${
          iconPosition === 'left' ? 'pl-11 pr-5' : 'pl-5 pr-12'
        } ${inputClassName}`}
      />
      {iconPosition === 'right' ? (
        interactive ? (
          <button
            type="button"
            aria-label="Search"
            onClick={() => onSearch?.(value ?? '')}
            className="absolute right-4 text-relaive-gray transition-colors hover:text-relaive-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary rounded-full"
          >
            <SearchIcon />
          </button>
        ) : (
          <span className="pointer-events-none absolute right-4 text-relaive-gray">
            <SearchIcon />
          </span>
        )
      ) : null}
    </label>
  )
}
