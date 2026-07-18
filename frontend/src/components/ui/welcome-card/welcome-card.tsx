type WelcomeCardProps = {
  name: string
  subtitle: string
  className?: string
}

export function WelcomeCard({ name, subtitle, className = '' }: WelcomeCardProps) {
  return (
    <section
      className={`rounded-3xl bg-gradient-to-r from-relaive-primary to-relaive-secondary px-6 py-8 shadow-[0_4px_24px_rgba(26,32,44,0.08)] sm:px-8 sm:py-10 ${className}`}
    >
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Welcome back, {name}
      </h1>
      <p className="mt-2 text-sm text-white/80 sm:text-base">{subtitle}</p>
    </section>
  )
}
