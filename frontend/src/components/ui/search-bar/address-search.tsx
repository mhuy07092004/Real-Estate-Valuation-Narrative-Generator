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
  readOnly = true,
  iconPosition = 'right',
  value,
  defaultValue,
  onChange,
  onKeyDown,
  id,
  name,
}: AddressSearchProps) {
  return (
    <label className={`relative flex w-full max-w-md items-center ${className}`}>
      <span className="sr-only">Property address</span>
      {iconPosition === 'left' ? (
        <span className="pointer-events-none absolute left-4 text-relaive-gray">
          <SearchIcon />
        </span>
      ) : null}
      <input
        id={id}
        name={name}
        type="text"
        placeholder={placeholder}
        readOnly={readOnly}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        onKeyDown={onKeyDown}
        className={`w-full rounded-full border border-black/5 bg-white py-3 text-sm text-relaive-navy shadow-[0_2px_12px_rgba(26,32,44,0.08)] placeholder:text-relaive-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary ${
          iconPosition === 'left' ? 'pl-11 pr-5' : 'pl-5 pr-12'
        } ${inputClassName}`}
      />
      {iconPosition === 'right' ? (
        <span className="pointer-events-none absolute right-4 text-relaive-gray">
          <SearchIcon />
        </span>
      ) : null}
    </label>
  )
}
