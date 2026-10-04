import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { AddressSearch } from './address-search'
import { getAddressSuggestions, type AddressSuggestion } from '../../../services/autocomplete'

// Don't fire on 1-2 characters (mostly noise, wastes calls), and debounce so
// a fast typist doesn't fire one request per keystroke.
const SUGGESTION_MIN_LENGTH = 3
const SUGGESTION_DEBOUNCE_MS = 300

export type AddressAutocompleteInputProps = {
  value: string
  onChange: (value: string) => void
  /** Called once the user commits to a suggestion — clean, Google-formatted text. */
  onSelect?: (suggestion: AddressSuggestion) => void
  /**
   * Called on Enter (or the search icon) when no suggestion is highlighted.
   * Omit this inside a <form> to let native submit handle Enter instead.
   */
  onEnter?: (value: string) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  iconPosition?: 'left' | 'right'
  id?: string
  name?: string
}

/**
 * A free-text address field with a Google Places suggestion dropdown —
 * originally built for the landing page's map search (map-card.tsx),
 * extracted so the standalone Comparable Sales search and the report
 * wizard's Step 1 can reuse the same debounce/session/keyboard-nav
 * behavior instead of duplicating it.
 */
export function AddressAutocompleteInput({
  value,
  onChange,
  onSelect,
  onEnter,
  placeholder,
  className,
  inputClassName,
  iconPosition,
  id,
  name,
}: AddressAutocompleteInputProps) {
  // Set right before a programmatic onChange (picking a suggestion) so the
  // debounced suggestions effect below doesn't treat it as a fresh keystroke
  // and reopen the dropdown ~300ms after it was just closed.
  const skipNextSuggestionFetchRef = useRef(false)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  // One id per "typing session" (Google's term) — first keystroke through
  // picking a result or searching directly. Kept in a ref, not state: it
  // never drives a render, it's just a value threaded through to the API.
  const sessionTokenRef = useRef<string | null>(null)

  const getSessionToken = useCallback(() => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = crypto.randomUUID()
    }
    return sessionTokenRef.current
  }, [])

  const endSession = useCallback(() => {
    sessionTokenRef.current = null
  }, [])

  // Debounced suggestions fetch as the user types.
  useEffect(() => {
    if (skipNextSuggestionFetchRef.current) {
      skipNextSuggestionFetchRef.current = false
      return
    }
    if (value.trim().length < SUGGESTION_MIN_LENGTH) {
      setSuggestions([])
      setIsSuggestionsOpen(false)
      return
    }

    let cancelled = false
    const timer = setTimeout(() => {
      getAddressSuggestions(value, getSessionToken())
        .then((results) => {
          if (cancelled) return
          setSuggestions(results)
          setIsSuggestionsOpen(results.length > 0)
          setHighlightedIndex(-1)
        })
        .catch(() => {
          // Secondary feature — fail quietly, the field still works as a
          // plain text input.
          if (cancelled) return
          setSuggestions([])
          setIsSuggestionsOpen(false)
        })
    }, SUGGESTION_DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [value, getSessionToken])

  const closeSuggestions = useCallback(() => {
    setSuggestions([])
    setIsSuggestionsOpen(false)
    setHighlightedIndex(-1)
  }, [])

  const selectSuggestion = useCallback(
    (suggestion: AddressSuggestion) => {
      skipNextSuggestionFetchRef.current = true
      onChange(suggestion.description)
      closeSuggestions()
      endSession()
      onSelect?.(suggestion)
    },
    [onChange, closeSuggestions, endSession, onSelect],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!isSuggestionsOpen || suggestions.length === 0) {
        if (event.key === 'Enter' && onEnter) {
          event.preventDefault()
          endSession()
          onEnter(value)
        }
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setHighlightedIndex((i) => (i + 1) % suggestions.length)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setHighlightedIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
      } else if (event.key === 'Enter') {
        event.preventDefault()
        if (highlightedIndex >= 0) {
          selectSuggestion(suggestions[highlightedIndex])
        } else if (onEnter) {
          endSession()
          onEnter(value)
        }
      } else if (event.key === 'Escape') {
        closeSuggestions()
      }
    },
    [isSuggestionsOpen, suggestions, highlightedIndex, value, onEnter, selectSuggestion, closeSuggestions, endSession],
  )

  return (
    <div
      className={`relative w-full ${className ?? ''}`}
      // Closes the dropdown once focus truly leaves this wrapper (input or
      // any suggestion button) — not on every blur, since clicking a
      // suggestion blurs the input first.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          closeSuggestions()
        }
      }}
    >
      <AddressSearch
        id={id}
        name={name}
        className="max-w-none"
        value={value}
        placeholder={placeholder}
        inputClassName={inputClassName}
        iconPosition={iconPosition}
        readOnly={false}
        onChange={(next) => {
          onChange(next)
          setIsSuggestionsOpen(true)
        }}
        onSearch={
          onEnter
            ? (text) => {
                endSession()
                onEnter(text)
              }
            : undefined
        }
        onKeyDown={handleKeyDown}
      />
      {isSuggestionsOpen && suggestions.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-black/5 bg-white py-1.5 shadow-[0_4px_24px_rgba(26,32,44,0.12)]">
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.placeId}>
              <button
                type="button"
                // Keeps the input focused through the click so this fires
                // before the wrapper's onBlur would otherwise close the list.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex w-full flex-col items-start gap-0.5 px-4 py-2 text-left transition-colors ${
                  index === highlightedIndex ? 'bg-relaive-primary/10' : 'hover:bg-slate-50'
                }`}
              >
                <span className="text-sm text-relaive-navy">{suggestion.mainText}</span>
                {suggestion.secondaryText && (
                  <span className="text-xs text-relaive-gray">{suggestion.secondaryText}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
