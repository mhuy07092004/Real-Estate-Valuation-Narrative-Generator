import { describe, expect, test } from 'vitest'
import { parseAuAddress } from '../src/utils/au-address.js'

describe('parseAuAddress', () => {
    test('parses the canonical street, suburb STATE postcode form', () => {
        expect(parseAuAddress('45 Smith Street, South Yarra VIC 3141')).toEqual({
            streetLine: '45 Smith Street',
            suburb: 'South Yarra',
            state: 'VIC',
            postcode: '3141',
        })
    })

    test('parses a unit number that does not start with digits and a space', () => {
        expect(parseAuAddress('12/45 Smith Street, Richmond VIC 3121')).toEqual({
            streetLine: '12/45 Smith Street',
            suburb: 'Richmond',
            state: 'VIC',
            postcode: '3121',
        })
    })

    test('parses a unit prefix before the street number', () => {
        expect(parseAuAddress('Unit 5 Smith St, Richmond VIC 3121')).toEqual({
            streetLine: 'Unit 5 Smith St',
            suburb: 'Richmond',
            state: 'VIC',
            postcode: '3121',
        })
    })

    test('allows a comma before the state', () => {
        expect(parseAuAddress('45 Smith Street, South Yarra, VIC 3141')).toEqual({
            streetLine: '45 Smith Street',
            suburb: 'South Yarra',
            state: 'VIC',
            postcode: '3141',
        })
    })

    test('allows a missing postcode', () => {
        expect(parseAuAddress('45 Smith Street, South Yarra VIC')).toEqual({
            streetLine: '45 Smith Street',
            suburb: 'South Yarra',
            state: 'VIC',
            postcode: '',
        })
    })

    test('strips a trailing Australia or AU suffix', () => {
        expect(parseAuAddress('45 Smith Street, South Yarra VIC 3141, Australia')).toEqual({
            streetLine: '45 Smith Street',
            suburb: 'South Yarra',
            state: 'VIC',
            postcode: '3141',
        })
        expect(parseAuAddress('45 Smith Street, South Yarra VIC 3141, AU')).toMatchObject({
            postcode: '3141',
            state: 'VIC',
        })
    })

    test('keeps a multi-word suburb that starts with a short token', () => {
        expect(parseAuAddress('10 Fitzroy Street, St Kilda VIC 3182')).toEqual({
            streetLine: '10 Fitzroy Street',
            suburb: 'St Kilda',
            state: 'VIC',
            postcode: '3182',
        })
    })

    test('collapses extra whitespace and uppercases the state', () => {
        expect(parseAuAddress('  45   Smith Street,   south yarra   vic   3141  ')).toEqual({
            streetLine: '45 Smith Street',
            suburb: 'south yarra',
            state: 'VIC',
            postcode: '3141',
        })
    })

    test('rejects an address with no comma or no state', () => {
        expect(parseAuAddress('South Yarra VIC 3141')).toBeNull()
        expect(parseAuAddress('45 Smith Street, South Yarra')).toBeNull()
        expect(parseAuAddress('')).toBeNull()
    })
})
