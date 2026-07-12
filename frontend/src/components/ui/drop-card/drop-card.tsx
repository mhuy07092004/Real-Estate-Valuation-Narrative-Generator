import {
  createContext,
  useContext,
  useId,
  useState,
  type ReactNode,
} from 'react'

type DropCardContextValue = {
  allowMultiple: boolean
  isOpen: (id: string) => boolean
  toggle: (id: string) => void
}

const DropCardContext = createContext<DropCardContextValue | null>(null)

type DropCardGroupProps = {
  children: ReactNode
  allowMultiple?: boolean
  defaultOpenIds?: string[]
  className?: string
}

export function DropCardGroup({
  children,
  allowMultiple = false,
  defaultOpenIds = [],
  className = '',
}: DropCardGroupProps) {
  const [openIds, setOpenIds] = useState<string[]>(defaultOpenIds)

  const isOpen = (id: string) => openIds.includes(id)

  const toggle = (id: string) => {
    setOpenIds((current) => {
      if (isOpen(id)) {
        return current.filter((openId) => openId !== id)
      }

      if (allowMultiple) {
        return [...current, id]
      }

      return [id]
    })
  }

  return (
    <DropCardContext.Provider value={{ allowMultiple, isOpen, toggle }}>
      <div className={`flex flex-col gap-3 ${className}`}>{children}</div>
    </DropCardContext.Provider>
  )
}

export type DropCardProps = {
  id?: string
  icon: ReactNode
  title: string
  description: ReactNode
  children?: ReactNode
  defaultOpen?: boolean
  className?: string
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 text-relaive-gray transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DropCard({
  id,
  icon,
  title,
  description,
  children,
  defaultOpen = false,
  className = '',
}: DropCardProps) {
  const generatedId = useId()
  const cardId = id ?? generatedId
  const group = useContext(DropCardContext)
  const [standaloneOpen, setStandaloneOpen] = useState(defaultOpen)

  const open = group ? group.isOpen(cardId) : standaloneOpen
  const expandable = Boolean(children)

  const handleToggle = () => {
    if (!expandable) {
      return
    }

    if (group) {
      group.toggle(cardId)
      return
    }

    setStandaloneOpen((current) => !current)
  }

  return (
    <article
      className={`rounded-2xl bg-slate-50/90 ${className}`}
      data-open={open || undefined}
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={expandable ? open : undefined}
        aria-controls={expandable ? `${cardId}-content` : undefined}
        disabled={!expandable}
        className={`flex w-full items-start gap-4 rounded-2xl p-4 text-left transition-colors sm:p-5 ${
          expandable
            ? 'cursor-pointer hover:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary focus-visible:ring-offset-2'
            : 'cursor-default'
        }`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-relaive-primary text-white">
          {icon}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <h4 className="text-sm font-semibold text-relaive-navy sm:text-base">{title}</h4>
          <p className="mt-1 text-sm leading-relaxed text-relaive-gray">{description}</p>
        </div>

        {expandable ? <ChevronIcon open={open} /> : null}
      </button>

      {expandable ? (
        <div
          id={`${cardId}-content`}
          hidden={!open}
          className="border-t border-black/5 px-4 pb-4 pt-0 sm:px-5 sm:pb-5"
        >
          <div className="pt-3 text-sm leading-relaxed text-relaive-gray">{children}</div>
        </div>
      ) : null}
    </article>
  )
}

export type DropCardItem = Pick<
  DropCardProps,
  'id' | 'icon' | 'title' | 'description' | 'children' | 'defaultOpen'
>

type DropCardListProps = {
  items: DropCardItem[]
  allowMultiple?: boolean
  defaultOpenIds?: string[]
  className?: string
}

export function DropCardList({
  items,
  allowMultiple = false,
  defaultOpenIds,
  className = '',
}: DropCardListProps) {
  return (
    <DropCardGroup
      allowMultiple={allowMultiple}
      defaultOpenIds={defaultOpenIds}
      className={className}
    >
      {items.map((item) => (
        <DropCard key={item.id ?? item.title} {...item} />
      ))}
    </DropCardGroup>
  )
}
