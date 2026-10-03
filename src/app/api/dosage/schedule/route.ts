import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── POST: Create a dosage schedule ───────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patientId,
      medicineId,
      medicineName,
      dosage,
      frequency,
      timing,
      startDate,
      endDate,
      instructions,
      createdBy,
    } = body as {
      patientId: string
      medicineId?: string
      medicineName: string
      dosage: string
      frequency: string
      timing?: string[]
      startDate: string
      endDate?: string
      instructions?: string
      createdBy?: string
    }

    if (!patientId || !medicineName || !dosage || !frequency || !startDate) {
      return NextResponse.json(
        { error: 'patientId, medicineName, dosage, frequency, and startDate are required' },
        { status: 400 }
      )
    }

    const validFrequencies = ['ONCE_DAILY', 'TWICE_DAILY', 'THRICE_DAILY', 'WEEKLY', 'AS_NEEDED']
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: `frequency must be one of: ${validFrequencies.join(', ')}` },
        { status: 400 }
      )
    }

    const parsedStartDate = new Date(startDate)
    if (isNaN(parsedStartDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid startDate format' },
        { status: 400 }
      )
    }

    let parsedEndDate: Date | undefined
    if (endDate) {
      parsedEndDate = new Date(endDate)
      if (isNaN(parsedEndDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid endDate format' },
          { status: 400 }
        )
      }
    }

    const schedule = await db.medicineSchedule.create({
      data: {
        patientId,
        medicineId: medicineId || null,
        medicineName,
        dosage,
        frequency,
        timing: timing ? JSON.stringify(timing) : null,
        startDate: parsedStartDate,
        endDate: parsedEndDate || null,
        instructions: instructions || null,
        isActive: true,
        createdBy: createdBy || null,
      },
    })

    // Generate default timing slots if not provided
    let defaultTiming: string[] | null = null
    if (!timing) {
      switch (frequency) {
        case 'ONCE_DAILY': defaultTiming = ['08:00']; break
        case 'TWICE_DAILY': defaultTiming = ['08:00', '20:00']; break
        case 'THRICE_DAILY': defaultTiming = ['08:00', '14:00', '20:00']; break
        case 'WEEKLY': defaultTiming = ['08:00']; break
      }
    }

    return NextResponse.json({
      data: {
        ...schedule,
        parsedTiming: timing || defaultTiming,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[DOSAGE_SCHEDULE_POST]', error)
    return NextResponse.json({ error: 'Failed to create dosage schedule' }, { status: 500 })
  }
}
