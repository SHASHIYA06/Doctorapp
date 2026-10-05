import { NextRequest, NextResponse } from 'next/server'

// Pharmacy Inventory API — returns mock data for frontend consumption
// In production, this would query the database with Prisma

const inventoryItems = [
  { id: '1', medicineName: 'Dolo 650', genericName: 'Paracetamol', currentStock: 250, mrp: 32, batchNumber: 'DL-2026-001', expiryDate: '2027-06-15', threshold: 50, category: 'Analgesic', manufacturer: 'Micro Labs Ltd', unit: 'Tablet', lastUpdated: '2026-10-01T09:30:00Z' },
  { id: '2', medicineName: 'Azithromycin 500mg', genericName: 'Azithromycin', currentStock: 8, mrp: 85, batchNumber: 'AZ-2026-042', expiryDate: '2027-03-20', threshold: 20, category: 'Antibiotic', manufacturer: 'Alkem Laboratories', unit: 'Tablet', lastUpdated: '2026-10-02T11:15:00Z' },
  { id: '3', medicineName: 'Metformin 500mg', genericName: 'Metformin', currentStock: 0, mrp: 15, batchNumber: 'MT-2026-118', expiryDate: '2028-01-10', threshold: 100, category: 'Antidiabetic', manufacturer: 'USV Pvt Ltd', unit: 'Tablet', lastUpdated: '2026-09-28T14:00:00Z' },
  { id: '4', medicineName: 'Amlodipine 5mg', genericName: 'Amlodipine', currentStock: 120, mrp: 42, batchNumber: 'AM-2026-077', expiryDate: '2027-09-30', threshold: 30, category: 'Antihypertensive', manufacturer: 'Lupin Ltd', unit: 'Tablet', lastUpdated: '2026-10-03T08:45:00Z' },
  { id: '5', medicineName: 'Omeprazole 20mg', genericName: 'Omeprazole', currentStock: 5, mrp: 28, batchNumber: 'OM-2026-203', expiryDate: '2027-04-18', threshold: 25, category: 'PPI', manufacturer: 'Dr Reddys', unit: 'Capsule', lastUpdated: '2026-10-02T16:20:00Z' },
  { id: '6', medicineName: 'Cetirizine 10mg', genericName: 'Cetirizine', currentStock: 180, mrp: 18, batchNumber: 'CT-2026-055', expiryDate: '2028-03-25', threshold: 40, category: 'Antihistamine', manufacturer: 'Cipla Ltd', unit: 'Tablet', lastUpdated: '2026-10-01T10:00:00Z' },
  { id: '7', medicineName: 'Amoxicillin 500mg', genericName: 'Amoxicillin', currentStock: 0, mrp: 55, batchNumber: 'AX-2026-089', expiryDate: '2027-02-14', threshold: 30, category: 'Antibiotic', manufacturer: 'GlaxoSmithKline', unit: 'Capsule', lastUpdated: '2026-09-25T12:30:00Z' },
  { id: '8', medicineName: 'Atorvastatin 10mg', genericName: 'Atorvastatin', currentStock: 95, mrp: 65, batchNumber: 'AT-2026-144', expiryDate: '2027-11-20', threshold: 25, category: 'Statin', manufacturer: 'Sun Pharma', unit: 'Tablet', lastUpdated: '2026-10-03T07:00:00Z' },
  { id: '9', medicineName: 'Pantoprazole 40mg', genericName: 'Pantoprazole', currentStock: 3, mrp: 72, batchNumber: 'PT-2026-312', expiryDate: '2026-10-25', threshold: 20, category: 'PPI', manufacturer: 'Alkem Laboratories', unit: 'Injection', lastUpdated: '2026-10-02T09:10:00Z' },
  { id: '10', medicineName: 'Ciprofloxacin 500mg', genericName: 'Ciprofloxacin', currentStock: 45, mrp: 38, batchNumber: 'CP-2026-098', expiryDate: '2027-07-08', threshold: 20, category: 'Antibiotic', manufacturer: 'Ranbaxy', unit: 'Tablet', lastUpdated: '2026-10-01T15:45:00Z' },
  { id: '11', medicineName: 'Losartan 50mg', genericName: 'Losartan', currentStock: 7, mrp: 48, batchNumber: 'LS-2026-066', expiryDate: '2027-08-12', threshold: 30, category: 'Antihypertensive', manufacturer: 'Torrent Pharma', unit: 'Tablet', lastUpdated: '2026-10-03T11:30:00Z' },
  { id: '12', medicineName: 'Montelukast 10mg', genericName: 'Montelukast', currentStock: 200, mrp: 95, batchNumber: 'ML-2026-177', expiryDate: '2028-02-28', threshold: 35, category: 'Anti-asthmatic', manufacturer: 'Sun Pharma', unit: 'Tablet', lastUpdated: '2026-10-02T08:20:00Z' },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.toLowerCase() || ''
  const status = searchParams.get('status') || 'ALL'

  let items = [...inventoryItems]

  if (search) {
    items = items.filter(i =>
      i.medicineName.toLowerCase().includes(search) ||
      i.genericName.toLowerCase().includes(search) ||
      i.batchNumber.toLowerCase().includes(search)
    )
  }

  if (status !== 'ALL') {
    items = items.filter(i => {
      const s = i.currentStock === 0 ? 'OUT_OF_STOCK' : i.currentStock < i.threshold ? 'LOW_STOCK' : 'IN_STOCK'
      return s === status
    })
  }

  const total = inventoryItems.length
  const inStock = inventoryItems.filter(i => i.currentStock >= i.threshold && i.currentStock > 0).length
  const lowStock = inventoryItems.filter(i => i.currentStock > 0 && i.currentStock < i.threshold).length
  const outOfStock = inventoryItems.filter(i => i.currentStock === 0).length
  const totalValue = inventoryItems.reduce((sum, i) => sum + i.currentStock * i.mrp, 0)

  return NextResponse.json({
    items,
    stats: { total, inStock, lowStock, outOfStock, totalValue },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, action, quantity, reason } = body

    if (!itemId || !action || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // In production, update database with Prisma
    return NextResponse.json({
      success: true,
      message: `Stock ${action === 'add' ? 'added' : 'reduced'}: ${quantity} units for item ${itemId}`,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
