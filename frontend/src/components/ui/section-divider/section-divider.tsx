type SectionDividerProps = {
  label: string
  className?: string
}

export function SectionDivider({ label, className = '' }: SectionDividerProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-px flex-1 bg-[#E5E7EB]" />
      <h3 className="shrink-0 text-xs font-medium tracking-[0.08em] text-relaive-gray uppercase">
        {label}
      </h3>
      <div className="h-px flex-1 bg-[#E5E7EB]" />
    </div>
  )
}
