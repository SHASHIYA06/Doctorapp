import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── POST: Log a dose taken ───────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      scheduleId,
      patientId,
      medicineName,
      dosageTaken,
      takenAt,
      wasOnTime,
      notes,
    } = body as {
      scheduleId: string
      patientId: string
      medicineName: string
      dosageTaken?: string
      takenAt?: string
      wasOnTime?: boolean
      notes?: string
    }

    if (!scheduleId || !patientId || !medicineName) {
      return NextResponse.json(
        { error: 'scheduleId, patientId, and medicineName are required' },
        { status: 400 }
      )
    }

    // Verify schedule exists
    const schedule = await db.medicineSchedule.findUnique({
      where: { id: scheduleId },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Dosage schedule not found' },
        { status: 404 }
      )
    }

    if (schedule.patientId !== patientId) {
      return NextResponse.json(
        { error: 'Schedule does not belong to this patient' },
        { status: 400 }
      )
    }

    const parsedTakenAt = takenAt ? new Date(takenAt) : new Date()
    if (isNaN(parsedTakenAt.getTime())) {
      return NextResponse.json(
        { error: 'Invalid takenAt format' },
        { status: 400 }
      )
    }

    // Auto-determine wasOnTime if not provided
    let onTime = wasOnTime
    if (onTime === undefined && schedule.timing) {
      try {
        const timingSlots: string[] = JSON.parse(schedule.timing)
        const takenHour = parsedTakenAt.getHours()
        const takenMinute = parsedTakenAt.getMinutes()
        const takenTimeInMinutes = takenHour * 60 + takenMinute

        onTime = timingSlots.some((slot) => {
          const [h, m] = slot.split(':').map(Number)
          const slotTimeInMinutes = h * 60 + m
          // Within 30 minutes of scheduled time is "on time"
          return Math.abs(takenTimeInMinutes - slotTimeInMinutes) <= 30
        })
      } catch {
        onTime = true
      }
    }
    if (onTime === undefined) onTime = true

    const doseLog = await db.doseLog.create({
      data: {
        scheduleId,
        patientId,
        medicineName,
        dosageTaken: dosageTaken || schedule.dosage,
        takenAt: parsedTakenAt,
        wasOnTime: onTime,
        notes: notes || null,
      },
    })

    return NextResponse.json({
      data: doseLog,
    }, { status: 201 })
  } catch (error) {
    console.error('[DOSAGE_LOG_POST]', error)
    return NextResponse.json({ error: 'Failed to log dose' }, { status: 500 })
  }
}
