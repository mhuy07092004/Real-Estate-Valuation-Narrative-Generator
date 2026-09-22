import { describe, expect, test } from 'vitest'
import { createSavedPropertySchema } from '../src/validators/saved-property.validator.js'
import { geocodeQuerySchema } from '../src/validators/geocode.validator.js'
import { nearbyPlacesQuerySchema } from '../src/validators/places.validator.js'
import { createInspectionSchema, updateInspectionSchema } from '../src/validators/inspection.validator.js'

describe('createSavedPropertySchema', () => {
    const valid = { addressLine: '1 Main St', propertyType: 'house', bedrooms: 3, bathrooms: 2, areaSqm: 400 }

    test('accepts a fully valid payload', () => {
        expect(() => createSavedPropertySchema.parse(valid)).not.toThrow()
    })

    test('rejects non-integer bedrooms/bathrooms', () => {
        expect(() => createSavedPropertySchema.parse({ ...valid, bedrooms: 2.5 })).toThrow()
    })

    test('rejects a negative bedrooms/bathrooms/areaSqm', () => {
        expect(() => createSavedPropertySchema.parse({ ...valid, bedrooms: -1 })).toThrow()
        expect(() => createSavedPropertySchema.parse({ ...valid, areaSqm: -1 })).toThrow()
    })

    test('rejects a blank addressLine/propertyType', () => {
        expect(() => createSavedPropertySchema.parse({ ...valid, addressLine: '  ' })).toThrow()
        expect(() => createSavedPropertySchema.parse({ ...valid, propertyType: '' })).toThrow()
    })
})

describe('geocodeQuerySchema', () => {
    test('accepts a non-empty address', () => {
        expect(geocodeQuerySchema.parse({ address: '1 Main St' }).address).toBe('1 Main St')
    })

    test('rejects a blank address', () => {
        expect(() => geocodeQuerySchema.parse({ address: '   ' })).toThrow()
    })

    test('rejects a missing address', () => {
        expect(() => geocodeQuerySchema.parse({})).toThrow()
    })
})

describe('nearbyPlacesQuerySchema', () => {
    test('coerces string query-param values (as Express always sends) into numbers', () => {
        const result = nearbyPlacesQuerySchema.parse({ lat: '-37.8', lng: '145.0' })
        expect(result.lat).toBe(-37.8)
        expect(result.lng).toBe(145.0)
    })

    test('defaults radiusMeters to 5000 when omitted', () => {
        const result = nearbyPlacesQuerySchema.parse({ lat: '0', lng: '0' })
        expect(result.radiusMeters).toBe(5000)
    })

    test('rejects latitude/longitude outside valid Earth-coordinate ranges', () => {
        expect(() => nearbyPlacesQuerySchema.parse({ lat: '91', lng: '0' })).toThrow()
        expect(() => nearbyPlacesQuerySchema.parse({ lat: '0', lng: '181' })).toThrow()
        expect(() => nearbyPlacesQuerySchema.parse({ lat: '-91', lng: '0' })).toThrow()
    })

    test('caps radiusMeters at Google\'s 50km API maximum', () => {
        expect(() => nearbyPlacesQuerySchema.parse({ lat: '0', lng: '0', radiusMeters: '50001' })).toThrow()
        expect(() => nearbyPlacesQuerySchema.parse({ lat: '0', lng: '0', radiusMeters: '50000' })).not.toThrow()
    })

    test('rejects a radiusMeters of 0 or below', () => {
        expect(() => nearbyPlacesQuerySchema.parse({ lat: '0', lng: '0', radiusMeters: '0' })).toThrow()
    })
})

describe('createInspectionSchema', () => {
    const valid = { addressLine: '1 Main St', suburb: 'Richmond', inspectionDate: '2026-06-01', agents: ['Alice'] }

    test('accepts a fully valid payload', () => {
        expect(() => createInspectionSchema.parse(valid)).not.toThrow()
    })

    test('requires at least one agent', () => {
        expect(() => createInspectionSchema.parse({ ...valid, agents: [] })).toThrow()
    })

    test('rejects an agent that is a blank string', () => {
        expect(() => createInspectionSchema.parse({ ...valid, agents: ['  '] })).toThrow()
    })
})

describe('updateInspectionSchema', () => {
    const validChecklistItem = { id: 'item-1', label: 'Roof', description: '', status: 'ok' as const }
    const valid = {
        address: '1 Main St',
        suburb: 'Richmond',
        inspectionDate: '2026-06-01',
        agents: ['Alice'],
        overallNotes: '',
        checklist: [validChecklistItem],
    }

    test('accepts a fully valid payload including an empty checklist array', () => {
        expect(() => updateInspectionSchema.parse(valid)).not.toThrow()
        expect(() => updateInspectionSchema.parse({ ...valid, checklist: [] })).not.toThrow()
    })

    test('rejects a checklist item with a status outside the fixed enum', () => {
        expect(() =>
            updateInspectionSchema.parse({
                ...valid,
                checklist: [{ ...validChecklistItem, status: 'unknown_status' }],
            }),
        ).toThrow()
    })

    test('accepts an optional nonnegative estimatedCost on a checklist item and rejects a negative one', () => {
        expect(() =>
            updateInspectionSchema.parse({ ...valid, checklist: [{ ...validChecklistItem, estimatedCost: 500 }] }),
        ).not.toThrow()
        expect(() =>
            updateInspectionSchema.parse({ ...valid, checklist: [{ ...validChecklistItem, estimatedCost: -1 }] }),
        ).toThrow()
    })

    test('overallNotes accepts an empty string but must be present', () => {
        const { overallNotes, ...missing } = valid
        expect(() => updateInspectionSchema.parse(missing)).toThrow()
    })
})
