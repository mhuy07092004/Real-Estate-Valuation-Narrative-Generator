type ConfidenceTone = 'high' | 'medium' | 'low'

function getConfidenceTone(value: number): ConfidenceTone {
  if (value >= 85) return 'high'
  if (value >= 70) return 'medium'
  return 'low'
}

const TONE_STYLES: Record<ConfidenceTone, { text: string; bar: string }> = {
  high: { text: 'text-emerald-600', bar: 'bg-emerald-500' },
  medium: { text: 'text-orange-500', bar: 'bg-orange-500' },
  low: { text: 'text-red-500', bar: 'bg-red-500' },
}

type ConfidenceBarProps = {
  value: number | null
  className?: string
}

export function ConfidenceBar({ value, className = '' }: ConfidenceBarProps) {
  if (value == null) {
    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        <span className="text-sm font-bold text-relaive-gray">—</span>
        <div className="h-1 w-16 rounded-full bg-gray-100" />
      </div>
    )
  }

  const tone = getConfidenceTone(value)
  const styles = TONE_STYLES[tone]

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className={`text-sm font-bold ${styles.text}`}>{value}%</span>
      <div className="h-1 w-16 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${styles.bar}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
