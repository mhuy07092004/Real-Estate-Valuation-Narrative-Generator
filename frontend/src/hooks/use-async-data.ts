import { useEffect, useState } from 'react'

export type AsyncDataState<T> = {
  data: T | null
  isLoading: boolean
  error: Error | null
}

/**
 * Calls `fetcher` on mount (and whenever `deps` changes) and tracks the
 * resulting loading/data/error state. Lets components follow the real
 * `useEffect -> service -> state` data flow even while services still
 * return local mock data.
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[] = []): AsyncDataState<T> {
  const [state, setState] = useState<AsyncDataState<T>>({
    data: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, isLoading: false, error: null })
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ data: null, isLoading: false, error })
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
