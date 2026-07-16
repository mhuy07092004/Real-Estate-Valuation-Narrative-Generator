export type Metric = { value: string; label: string }

export type Feature = {
  id: string
  icon: string
  title: string
  description: string
  features: string[]
  tags?: string[]
  highlight?: boolean
}

export type ValuationStep = {
  id: string
  icon: string
  title: string
  description: string
  details: string
}

export type HomepageContent = {
  hero: {
    title: string
    highlight: string
    subtitle: string
    metrics: Metric[]
  }
  features: {
    title: string
    description: string
    items: Feature[]
  }
  about: {
    title: string
    description: string
    trustFeatures: string[]
    banner: string
    valuationSteps: ValuationStep[]
  }
}
