import { describe, expect, it } from 'vitest'
import { getHomepageContent } from '../../src/services/content.service.js'

describe('content.service', () => {
  it('returns hero, features, and about sections', () => {
    const content = getHomepageContent()
    expect(content.hero.metrics).toHaveLength(3)
    expect(content.features.items.length).toBeGreaterThan(0)
    expect(content.about.valuationSteps).toHaveLength(4)
  })
})
