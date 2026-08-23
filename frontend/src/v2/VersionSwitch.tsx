import type { ReactNode } from 'react'
import { useUiVersion } from './use-ui-version'

type VersionSwitchProps = {
  v1: ReactNode
  v2: ReactNode
}

/** Renders `v1` or `v2` depending on the runtime toggle. This is the only thing a migrated route should need to change. */
export function VersionSwitch({ v1, v2 }: VersionSwitchProps) {
  const version = useUiVersion()
  return <>{version === 'v2' ? v2 : v1}</>
}
