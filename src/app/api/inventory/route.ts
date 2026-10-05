import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// ─── Validation Schemas ──────────────────────────────────────────

const inventoryQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).default('ALL'),
  category: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
})

const stockAdjustSchema = z.object({
  itemId: z.string().min(1),
  action: z.enum(['add', 'reduce', 'set']),
  quantity: z.number().positive(),
  reason: z.string().optional(),
})

// ─── GET: Pharmacy Inventory with search, filter, stats ──────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = inventoryQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 })
    }

    const { search, status, category, page, limit } = parsed.data

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { medicineName: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (category) where.category = category

    // Status filter
    if (status === 'OUT_OF_STOCK') where.currentStock = 0
    else if (status === 'LOW_STOCK') where.AND = [{ currentStock: { gt: 0 } }, { lowStockThreshold: { not: null } }]
    else if (status === 'IN_STOCK') where.currentStock = { gt: 0 }

    const [items, total] = await Promise.all([
      db.pharmacyInventory.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { lastUpdated: 'desc' },
      }),
      db.pharmacyInventory.count({ where }),
    ])

    // Compute stats
    const allItems = await db.pharmacyInventory.findMany({
      select: { currentStock: true, mrp: true, lowStockThreshold: true },
    })
    const inStock = allItems.filter(i => i.currentStock > 0 && (i.lowStockThreshold === null || i.currentStock >= (i.lowStockThreshold ?? 0))).length
    const lowStock = allItems.filter(i => i.currentStock > 0 && i.lowStockThreshold !== null && i.currentStock < (i.lowStockThreshold ?? 0)).length
    const outOfStock = allItems.filter(i => i.currentStock === 0).length
    const totalValue = allItems.reduce((sum, i) => sum + i.currentStock * (i.mrp?.toNumber() ?? 0), 0)

    return NextResponse.json({
      items,
      stats: { total, inStock, lowStock, outOfStock, totalValue },
      pagination: { page, limit, total },
    })
  } catch (error) {
    console.error('[INVENTORY_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

// ─── POST: Stock Adjustment ──────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = stockAdjustSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    }

    const { itemId, action, quantity, reason } = parsed.data

    const item = await db.pharmacyInventory.findUnique({ where: { id: itemId } })
    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    let newStock = item.currentStock
    if (action === 'add') newStock += quantity
    else if (action === 'reduce') {
      if (quantity > newStock) return NextResponse.json({ error: 'Cannot reduce below zero' }, { status: 400 })
      newStock -= quantity
    }
    else if (action === 'set') newStock = quantity

    const updated = await db.pharmacyInventory.update({
      where: { id: itemId },
      data: { currentStock: newStock, lastUpdated: new Date() },
    })

    // Create audit event
    await db.auditEvent.create({
      data: {
        action: `INVENTORY_${action.toUpperCase()}`,
        entityType: 'PharmacyInventory',
        entityId: itemId,
        details: JSON.stringify({ previousStock: item.currentStock, newStock, quantity, reason }),
        tenantId: item.tenantId || 'default',
      },
    })

    return NextResponse.json({ success: true, item: updated })
  } catch (error) {
    console.error('[INVENTORY_POST]', error)
    return NextResponse.json({ error: 'Failed to adjust inventory' }, { status: 500 })
  }
}
