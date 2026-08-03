import { Card } from '../../../components/ui/card/card'

type SettingsSectionPlaceholderProps = {
  title: string
}

export function SettingsSectionPlaceholder({ title }: SettingsSectionPlaceholderProps) {
  return (
    <Card className="flex-1">
      <h2 className="text-base font-semibold text-relaive-navy">{title}</h2>
      <p className="mt-2 text-sm text-relaive-gray">
        Content for this section will go here.
      </p>
    </Card>
  )
}
