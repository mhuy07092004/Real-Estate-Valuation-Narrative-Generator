import type { ReactNode } from 'react'

export type OptionCardItem = {
  id: string
  icon: ReactNode
  title: string
  description: string
  comingSoon?: boolean
}

type OptionCardProps = OptionCardItem & {
  selected: boolean
  onSelect: (id: string) => void
}

export function OptionCard({
  id,
  icon,
  title,
  description,
  comingSoon = false,
  selected,
  onSelect,
}: OptionCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-disabled={comingSoon}
      disabled={comingSoon}
      onClick={() => {
        if (!comingSoon) onSelect(id)
      }}
      className={`relative flex min-h-[180px] flex-col items-center justify-start rounded-2xl border px-5 py-6 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary focus-visible:ring-offset-2 ${
        comingSoon
          ? 'cursor-not-allowed border-black/5 bg-slate-100/80 opacity-60'
          : selected
            ? 'border-relaive-secondary bg-[#EAF7F6] shadow-[0_8px_24px_rgba(11,94,89,0.08)]'
            : 'border-black/5 bg-white hover:border-relaive-primary/20 hover:bg-slate-50 hover:shadow-sm'
      }`}
    >
      {comingSoon ? (
        <span className="absolute right-3 top-3 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Coming soon
        </span>
      ) : null}
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
          comingSoon ? 'bg-slate-200/80 text-slate-400' : 'bg-relaive-primary/10 text-relaive-primary'
        }`}
      >
        {icon}
      </span>
      <span
        className={`mt-4 text-base font-semibold ${comingSoon ? 'text-slate-400' : 'text-relaive-navy'}`}
      >
        {title}
      </span>
      <span className={`mt-2 text-sm leading-relaxed ${comingSoon ? 'text-slate-400' : 'text-relaive-gray'}`}>{description}</span>
    </button>
  )
}

type OptionCardGroupProps = {
  items: OptionCardItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  columns?: 2 | 3
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
  className = '',
}: OptionCardGroupProps) {
  return (
    <div className={`grid grid-cols-1 gap-4 ${COLUMNS_CLASS[columns]} ${className}`}>
      {items.map((item) => (
        <OptionCard key={item.id} {...item} selected={item.id === selectedId} onSelect={onSelect} />
      ))}
    </div>
  )
}
