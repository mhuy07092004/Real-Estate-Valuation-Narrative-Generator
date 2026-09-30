import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { Navbar } from '../components/ui/navbar/navbar'
import { Footer } from '../components/ui/footer/footer'
import { useLenis } from '../lib/smooth-scroll'

const SCROLL_OFFSET = 96

type PolicySection = {
  id: string
  title: string
  body: string
}

type PolicyGroup = {
  slug: PolicyDocSlug
  title: string
  sections: PolicySection[]
}

const POLICY_DOC_TITLES = {
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
  refund: 'Refund Policy',
} as const

type PolicyDocSlug = keyof typeof POLICY_DOC_TITLES

const POLICY_DOC_SLUGS = Object.keys(POLICY_DOC_TITLES) as PolicyDocSlug[]

function isPolicyDocSlug(value: string | undefined): value is PolicyDocSlug {
  return value !== undefined && value in POLICY_DOC_TITLES
}

const POLICY_GROUPS: PolicyGroup[] = POLICY_DOC_SLUGS.map((slug) => ({
  slug,
  title: POLICY_DOC_TITLES[slug],
  sections: [1, 2].map((n) => ({
    id: `${slug}-section-${n}`,
    title: `Section ${n}`,
    body: String(n),
  })),
}))

const ALL_SECTIONS = POLICY_GROUPS.flatMap((group) => group.sections)

const PANEL_CLASS =
  'rounded-3xl border border-black/5 bg-white shadow-[0_4px_24px_rgba(26,32,44,0.06)]'

function IconWrap({ children, size = 16 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

function PolicySidebar({
  query,
  onQueryChange,
  groups,
  activeId,
  onSelect,
}: {
  query: string
  onQueryChange: (value: string) => void
  groups: PolicyGroup[]
  activeId: string
  onSelect: (e: MouseEvent<HTMLAnchorElement>, targetId: string) => void
}) {
  return (
    <aside
      data-lenis-prevent
      className="flex flex-col gap-4 self-start lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
    >
      <label className={`${PANEL_CLASS} flex items-center gap-2 !rounded-xl px-3 py-2.5 text-relaive-gray`}>
        <IconWrap>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </IconWrap>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search terms..."
          aria-label="Search terms"
          className="w-full bg-transparent text-sm text-relaive-navy placeholder:text-relaive-gray/70 focus:outline-none"
        />
      </label>

      {groups.length === 0 ? (
        <div className={`${PANEL_CLASS} !rounded-2xl p-4`}>
          <p className="px-3 py-2 text-sm text-relaive-gray">No results</p>
        </div>
      ) : (
        groups.map((group) => {
          const groupActive = group.sections.some((s) => s.id === activeId)
          return (
            <nav
              key={group.slug}
              className={`${PANEL_CLASS} !rounded-2xl p-4 ${
                groupActive ? 'ring-1 ring-relaive-primary/25' : ''
              }`}
              aria-label={group.title}
            >
              <a
                href={`#${group.slug}`}
                onClick={(e) => onSelect(e, group.slug)}
                className="block rounded-lg px-3 pb-2 text-sm font-semibold text-relaive-navy transition-colors hover:text-relaive-primary"
              >
                {group.title}
              </a>
              <ul className="flex flex-col gap-0.5">
                {group.sections.map(({ id, title }) => {
                  const active = id === activeId
                  return (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        onClick={(e) => onSelect(e, id)}
                        aria-current={active ? 'true' : undefined}
                        className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                          active
                            ? 'bg-relaive-primary/10 font-medium text-relaive-primary'
                            : 'text-relaive-navy/80 hover:bg-relaive-surface hover:text-relaive-navy'
                        }`}
                      >
                        {title}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </nav>
          )
        })
      )}
    </aside>
  )
}

export default function PolicyPage() {
  const { doc } = useParams<{ doc: string }>()
  const location = useLocation()
  const lenis = useLenis()
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState(ALL_SECTIONS[0].id)

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return POLICY_GROUPS

    return POLICY_GROUPS.flatMap((group) => {
      if (group.title.toLowerCase().includes(q)) return [group]
      const matching = group.sections.filter((s) => s.title.toLowerCase().includes(q))
      return matching.length > 0 ? [{ ...group, sections: matching }] : []
    })
  }, [query])

  const scrollToId = useCallback(
    (id: string) => {
      const target = document.getElementById(id)
      if (!target) return
      if (lenis) {
        lenis.scrollTo(target, { offset: -SCROLL_OFFSET })
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    },
    [lenis],
  )

  function selectTarget(e: MouseEvent<HTMLAnchorElement>, targetId: string) {
    e.preventDefault()
    const section = ALL_SECTIONS.find((s) => s.id === targetId)
    if (section) setActiveId(section.id)
    scrollToId(targetId)
    window.history.replaceState(null, '', `${location.pathname}#${targetId}`)
  }

  useEffect(() => {
    if (!isPolicyDocSlug(doc)) return
    const hashId = location.hash.replace('#', '')
    const targetId = document.getElementById(hashId) ? hashId : doc
    const frame = requestAnimationFrame(() => scrollToId(targetId))
    return () => cancelAnimationFrame(frame)
  }, [doc, location.hash, scrollToId])

  useEffect(() => {
    const elements = ALL_SECTIONS.map(({ id }) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    )
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible) setActiveId(visible.target.id)
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  if (!isPolicyDocSlug(doc)) {
    return <Navigate to="/policy/terms" replace />
  }

  return (
    <div className="relative min-h-screen bg-relaive-surface">
      <Navbar />

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-14 lg:grid-cols-[280px_1fr]">
        <PolicySidebar
          query={query}
          onQueryChange={setQuery}
          groups={filteredGroups}
          activeId={activeId}
          onSelect={selectTarget}
        />

        <div className="flex min-w-0 flex-col gap-12">
          {POLICY_GROUPS.map((group) => (
            <div key={group.slug} className="flex flex-col gap-6">
              <header id={group.slug} className={`${PANEL_CLASS} scroll-mt-24 p-6 sm:p-7`}>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-relaive-secondary text-white">
                    <IconWrap>
                      <path d="M3 11l9-7 9 7" />
                      <path d="M5 10v10h14V10" />
                    </IconWrap>
                  </span>
                  <span className="text-sm font-medium text-relaive-primary">Legal</span>
                </div>
                <h1 className="mt-4 text-2xl font-bold text-relaive-navy sm:text-3xl">
                  {group.title}
                </h1>
                <p className="mt-2 text-xs text-relaive-gray">
                  Last updated:{' '}
                  <span className="font-semibold text-relaive-navy">January 15, 2026</span>
                </p>
                <p className="mt-4 text-sm leading-relaxed text-relaive-navy/80">Intro</p>
              </header>

              {group.sections.map(({ id, title, body }, index) => (
                <section
                  key={id}
                  id={id}
                  className={`${PANEL_CLASS} min-h-[60vh] scroll-mt-24 p-6 sm:p-7`}
                >
                  <h2 className="border-b border-black/5 pb-4 text-lg font-semibold text-relaive-navy">
                    {index + 1}. {title}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-relaive-navy/80">{body}</p>
                </section>
              ))}
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
