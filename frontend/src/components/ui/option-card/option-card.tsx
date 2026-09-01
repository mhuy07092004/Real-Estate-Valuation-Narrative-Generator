import type { ReactNode } from 'react'

export type OptionCardItem = {
  id: string
  icon: ReactNode
  title: string
  description: string
  comingSoon?: boolean
}

export type OptionCardLayout = 'grid' | 'list'

type OptionCardProps = OptionCardItem & {
  selected: boolean
  onSelect: (id: string) => void
  layout?: OptionCardLayout
}

function SelectedCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12.5 9.5 17 19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function OptionCard({
  id,
  icon,
  title,
  description,
  comingSoon = false,
  selected,
  onSelect,
  layout = 'grid',
}: OptionCardProps) {
  const isList = layout === 'list'

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-disabled={comingSoon}
      disabled={comingSoon}
      onClick={() => {
        if (!comingSoon) onSelect(id)
      }}
      className={`relative rounded-2xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary focus-visible:ring-offset-2 ${
        isList
          ? 'flex w-full items-center gap-4 px-5 py-5 text-left sm:gap-5 sm:px-6 sm:py-6'
          : 'flex min-h-[180px] flex-col items-center justify-start px-5 py-6 text-center'
      } ${
        comingSoon
          ? 'cursor-not-allowed border-black/5 bg-slate-100/80 opacity-60'
          : selected
            ? 'border-relaive-secondary bg-[#EAF7F6] shadow-[0_8px_24px_rgba(11,94,89,0.08)]'
            : 'border-black/5 bg-white hover:border-relaive-primary/20 hover:bg-slate-50 hover:shadow-sm'
      }`}
    >
      {!isList && comingSoon ? (
        <span className="absolute right-3 top-3 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Coming soon
        </span>
      ) : null}
      <span
        className={`flex shrink-0 items-center justify-center rounded-xl ${
          isList ? 'h-14 w-14' : 'h-12 w-12'
        } ${
          comingSoon
            ? 'bg-slate-200/80 text-slate-400'
            : isList && selected
              ? 'bg-gradient-to-br from-[#8FD4D8] to-relaive-secondary-hover text-white shadow-md shadow-relaive-secondary/30'
              : 'bg-relaive-primary/10 text-relaive-primary'
        }`}
      >
        {icon}
      </span>

      <div className={isList ? 'min-w-0 flex-1' : 'contents'}>
        <span
          className={
            isList
              ? 'flex flex-wrap items-center gap-2'
              : `mt-4 text-base font-semibold ${comingSoon ? 'text-slate-400' : 'text-relaive-navy'}`
          }
        >
          <span
            className={
              isList
                ? `text-base font-semibold sm:text-lg ${comingSoon ? 'text-slate-400' : 'text-relaive-navy'}`
                : undefined
            }
          >
            {title}
          </span>
          {isList && selected ? (
            <span className="rounded-md bg-relaive-secondary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-relaive-secondary-hover">
              Selected
            </span>
          ) : null}
          {isList && comingSoon ? (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Coming soon
            </span>
          ) : null}
        </span>
        <span
          className={
            isList
              ? `mt-1 block text-sm leading-relaxed ${comingSoon ? 'text-slate-400' : 'text-relaive-gray'}`
              : `mt-2 text-sm leading-relaxed ${comingSoon ? 'text-slate-400' : 'text-relaive-gray'}`
          }
        >
          {description}
        </span>
      </div>

      {isList && selected && !comingSoon ? (
        <span className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-relaive-secondary text-white">
          <SelectedCheckIcon />
        </span>
      ) : null}
    </button>
  )
}

type OptionCardGroupProps = {
  items: OptionCardItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  columns?: 2 | 3
  layout?: OptionCardLayout
  className?: string
}

const COLUMNS_CLASS: Record<2 | 3, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
}

export function OptionCardGroup({
  items,
  selectedId,
  onSelect,
  columns = 3,
  layout = 'grid',
  className = '',
}: OptionCardGroupProps) {
  const wrapperClass =
    layout === 'list' ? 'flex flex-col gap-4' : `grid grid-cols-1 gap-4 ${COLUMNS_CLASS[columns]}`

  return (
    <div className={`${wrapperClass} ${className}`}>
      {items.map((item) => (
        <OptionCard
          key={item.id}
          {...item}
          selected={item.id === selectedId}
          onSelect={onSelect}
          layout={layout}
        />
      ))}
    </div>
  )
}
