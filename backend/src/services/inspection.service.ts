// Data-access layer for Inspection — the only file allowed to query the
// database directly for this feature. Every function is scoped by
// ownerUserId so a caller can never read, create, or update another
// buyer's inspections. agents/checklist are stored as JSON columns, so
// every function here handles the JSON.parse/stringify boundary.
import { prisma } from '../lib/prisma.js'
import type { CreateInspectionInput, InspectionChecklistItem, UpdateInspectionInput } from '../validators/inspection.validator.js'

// Standard 10-item template a new inspection starts with — carried over
// from the old MSW mock data (buyer-handlers.ts), all fields blank/unchecked
// since nothing has actually been inspected yet.
const DEFAULT_CHECKLIST_LABELS = [
    'Exterior & Facade',
    'Roof Condition',
    'Moisture & Damp',
    'Kitchen',
    'Bathrooms',
    'Electrical',
    'Noise & Soundproofing',
    'Natural Light',
    'Storage',
    'Renovation / Repair Needs',
] as const

function buildDefaultChecklist(): InspectionChecklistItem[] {
    return DEFAULT_CHECKLIST_LABELS.map((label, index) => ({
        id: `item-${index + 1}`,
        label,
        description: '',
        status: 'not_checked' as const,
    }))
}

function parseRow(row: {
    inspectionId: string
    addressLine: string
    suburb: string
    inspectionDate: Date
    agentsJson: string
    overallNotes: string
    checklistJson: string
}) {
    return {
        id: row.inspectionId,
        address: row.addressLine,
        suburb: row.suburb,
        inspectionDate: row.inspectionDate.toISOString(),
        agents: JSON.parse(row.agentsJson) as string[],
        overallNotes: row.overallNotes,
        checklist: JSON.parse(row.checklistJson) as InspectionChecklistItem[],
    }
}

export async function listInspectionsByOwner(ownerUserId: string) {
    const rows = await prisma.inspection.findMany({
        where: { ownerUserId },
        orderBy: { inspectionDate: 'asc' },
    })
    return rows.map(parseRow)
}

export async function createInspection(ownerUserId: string, input: CreateInspectionInput) {
    const row = await prisma.inspection.create({
        data: {
            ownerUserId,
            addressLine: input.addressLine,
            suburb: input.suburb,
            inspectionDate: new Date(input.inspectionDate),
            agentsJson: JSON.stringify(input.agents),
            overallNotes: '',
            checklistJson: JSON.stringify(buildDefaultChecklist()),
        },
    })
    return parseRow(row)
}

export async function updateInspection(
    inspectionId: string,
    ownerUserId: string,
    input: UpdateInspectionInput,
) {
    const existing = await prisma.inspection.findFirst({ where: { inspectionId, ownerUserId } })
    if (!existing) return null

    const row = await prisma.inspection.update({
        where: { inspectionId },
        data: {
            addressLine: input.address,
            suburb: input.suburb,
            inspectionDate: new Date(input.inspectionDate),
            agentsJson: JSON.stringify(input.agents),
            overallNotes: input.overallNotes,
            checklistJson: JSON.stringify(input.checklist),
        },
    })
    return parseRow(row)
}
