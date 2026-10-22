// Author: The Long Tran
// Parity check: the backend must send the narrative model exactly the prompt
// format it was fine-tuned on. Rebuilds all 300 training/val/test prompts from
// their raw inputs and compares them with the prompts in the dataset files.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import {
    buildNarrativePrompt,
    money,
    num,
    parseNarrativeSections,
    type NarrativePromptInput,
} from '../src/services/narrative-prompt.js'

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data_ai', 'docs', 'fixtures')

function readJsonl(path: string): any[] {
    return readFileSync(path, 'utf-8')
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line))
}

function toPromptInput(row: any): NarrativePromptInput {
    return {
        role: row.role,
        subject: {
            street: row.subject.address,
            suburb: row.subject.suburb,
            state: row.subject.state,
            postcode: row.subject.postcode,
            propertyType: row.subject.propertyType,
            bedrooms: row.subject.bedrooms,
            bathrooms: row.subject.bathrooms,
            parking: row.subject.parking,
            areaSqm: row.subject.areaSqm,
        },
        estimatedValue: row.estimated_value,
        comparables: row.comparables,
        market: row.market,
        roi: row.roi,
        affordability: row.affordability,
    }
}

describe('buildNarrativePrompt', () => {
    const inputs = new Map(readJsonl(join(FIXTURES, 'narrative_dataset_inputs.jsonl')).map((row) => [row.pair_id, row]))
    const examples = ['train', 'val', 'test'].flatMap((split) => readJsonl(join(FIXTURES, 'finetune_ready', `${split}.jsonl`)))

    test('covers all 300 dataset examples', () => {
        expect(examples).toHaveLength(300)
    })

    test('reproduces every training prompt exactly', () => {
        const mismatches = examples.filter((example) => {
            const row = inputs.get(example.pair_id)
            return !row || buildNarrativePrompt(toPromptInput(row)) !== example.messages[0].content
        })
        expect(mismatches.map((example) => example.pair_id)).toEqual([])
    })
})

describe('number formatting', () => {
    test('money matches Python, including negatives and half-even rounding', () => {
        expect(money(1158400)).toBe('$1,158,400')
        expect(money(-6056.2)).toBe('$-6,056')
        expect(money(2.5)).toBe('$2')
        expect(money(null)).toBe('unknown')
    })

    test('num drops a trailing .0', () => {
        expect(num(29.0, 1)).toBe('29')
        expect(num(17.42424, 1)).toBe('17.4')
        expect(num(55)).toBe('55')
    })
})

describe('parseNarrativeSections', () => {
    test('splits on heading lines and never returns a heading as a paragraph', () => {
        const sections = parseNarrativeSections('APPRAISAL COMMENTARY\n\nFirst.\n\nSecond.\n\nGROWTH OUTLOOK\n\nThird.')
        expect(sections).toEqual([
            { heading: 'APPRAISAL COMMENTARY', paragraphs: ['First.', 'Second.'] },
            { heading: 'GROWTH OUTLOOK', paragraphs: ['Third.'] },
        ])
    })

    test('treats text without headings as the commentary', () => {
        expect(parseNarrativeSections('Only text.')).toEqual([{ heading: 'APPRAISAL COMMENTARY', paragraphs: ['Only text.'] }])
    })
})
