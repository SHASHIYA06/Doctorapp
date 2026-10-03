import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: Get dosage schedules + dose logs for a patient ──────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId') || ''
    const includeLogs = searchParams.get('includeLogs') !== 'false'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId query parameter is required' },
        { status: 400 }
      )
    }

    const where = { patientId, isActive: true }

    const [schedules, totalSchedules] = await Promise.all([
      db.medicineSchedule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: includeLogs
          ? {
              doseLogs: {
                orderBy: { takenAt: 'desc' },
                take: 10,
              },
            }
          : undefined,
      }),
      db.medicineSchedule.count({ where }),
    ])

    // Calculate adherence stats for each schedule
    const enrichedSchedules = schedules.map((schedule) => {
      const logs = schedule.doseLogs || []
      const now = new Date()

      // Calculate adherence for last 7 days
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const recentLogs = logs.filter((log) => new Date(log.takenAt) >= sevenDaysAgo)

      // Expected doses in last 7 days based on frequency
      let expectedDosesPerDay = 1
      switch (schedule.frequency) {
        case 'TWICE_DAILY': expectedDosesPerDay = 2; break
        case 'THRICE_DAILY': expectedDosesPerDay = 3; break
        case 'WEEKLY': expectedDosesPerDay = 1 / 7; break
        case 'AS_NEEDED': expectedDosesPerDay = 0; break
        default: expectedDosesPerDay = 1
      }

      const expectedDoses7d = Math.round(expectedDosesPerDay * 7)
      const onTimeLogs7d = recentLogs.filter((log) => log.wasOnTime).length
      const adherence7d = expectedDoses7d > 0
        ? Math.round((recentLogs.length / expectedDoses7d) * 100)
        : null
      const onTimeAdherence7d = expectedDoses7d > 0
        ? Math.round((onTimeLogs7d / expectedDoses7d) * 100)
        : null

      // Schedule status
      const isCurrentlyActive = schedule.isActive &&
        (!schedule.endDate || new Date(schedule.endDate) >= now)

      return {
        ...schedule,
        adherenceStats: {
          last7Days: {
            expectedDoses: expectedDoses7d,
            actualDoses: recentLogs.length,
            onTimeDoses: onTimeLogs7d,
            adherencePercentage: Math.min(adherence7d ?? 0, 100),
            onTimePercentage: Math.min(onTimeAdherence7d ?? 0, 100),
          },
          totalLogs: logs.length,
        },
        isCurrentlyActive,
      }
    })

    // Overall patient adherence
    const allLogs = await db.doseLog.findMany({
      where: { patientId },
      orderBy: { takenAt: 'desc' },
      take: 100,
    })

    const totalOnTime = allLogs.filter((log) => log.wasOnTime).length
    const overallAdherence = allLogs.length > 0
      ? Math.round((totalOnTime / allLogs.length) * 100)
      : null

    return NextResponse.json({
      data: {
        schedules: enrichedSchedules,
        overallAdherence: {
          totalDosesLogged: allLogs.length,
          onTimeDoses: totalOnTime,
          adherencePercentage: overallAdherence,
        },
      },
      pagination: { page, limit, total: totalSchedules, totalPages: Math.ceil(totalSchedules / limit) },
    })
  } catch (error) {
    console.error('[DOSAGE_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch dosage schedules' }, { status: 500 })
  }
}
