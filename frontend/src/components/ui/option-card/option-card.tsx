import type { ReactNode } from 'react'

export type OptionCardItem = {
  id: string
  icon: ReactNode
  title: string
  description: string
}

type OptionCardProps = OptionCardItem & {
  selected: boolean
  onSelect: (id: string) => void
}

export function OptionCard({ id, icon, title, description, selected, onSelect }: OptionCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(id)}
      className={`flex flex-col items-center rounded-2xl border px-6 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary focus-visible:ring-offset-2 ${
        selected
          ? 'border-relaive-secondary bg-[#EAF7F6] shadow-sm'
          : 'border-black/5 bg-white hover:border-relaive-primary/20 hover:bg-slate-50'
      }`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-relaive-primary/10 text-relaive-primary">
        {icon}
      </span>
      <span className="mt-4 text-sm font-semibold text-relaive-navy sm:text-base">{title}</span>
      <span className="mt-1.5 text-sm text-relaive-gray">{description}</span>
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
