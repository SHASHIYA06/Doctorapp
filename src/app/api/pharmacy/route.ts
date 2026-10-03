import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── Mock Pharmacy Data for Indian Districts ──────────────────────

interface Pharmacy {
  id: string
  name: string
  address: string
  district: string
  city: string
  state: string
  phone: string
  lat: number
  lng: number
  type: string
  is24Hours: boolean
  hasDriveThrough: boolean
  rating: number
  medicinesAvailable: string[]
}

const MOCK_PHARMACIES: Pharmacy[] = [
  // Delhi
  { id: 'ph-001', name: 'Apollo Pharmacy - Connaught Place', address: 'A-15, Connaught Place, New Delhi', district: 'Central Delhi', city: 'New Delhi', state: 'Delhi', phone: '+91-11-23456789', lat: 28.6315, lng: 77.2167, type: 'CHAIN', is24Hours: true, hasDriveThrough: false, rating: 4.5, medicinesAvailable: ['paracetamol', 'amoxicillin', 'omeprazole', 'metformin', 'cetirizine', 'azithromycin'] },
  { id: 'ph-002', name: 'MedPlus - Karol Bagh', address: '21, Ajmal Khan Road, Karol Bagh, New Delhi', district: 'Central Delhi', city: 'New Delhi', state: 'Delhi', phone: '+91-11-25789012', lat: 28.6520, lng: 77.1910, type: 'CHAIN', is24Hours: false, hasDriveThrough: false, rating: 4.2, medicinesAvailable: ['paracetamol', 'ibuprofen', 'omeprazole', 'atorvastatin', 'cetirizine'] },
  { id: 'ph-003', name: 'Guardian Pharmacy - Lajpat Nagar', address: 'F-32, Lajpat Nagar II, New Delhi', district: 'South Delhi', city: 'New Delhi', state: 'Delhi', phone: '+91-11-29876543', lat: 28.5680, lng: 77.2370, type: 'CHAIN', is24Hours: true, hasDriveThrough: false, rating: 4.3, medicinesAvailable: ['paracetamol', 'amoxicillin', 'metformin', 'azithromycin', 'atorvastatin'] },
  { id: 'ph-004', name: 'Neighbourhood Chemist - Janakpuri', address: 'C-2/17, Janakpuri, New Delhi', district: 'West Delhi', city: 'New Delhi', state: 'Delhi', phone: '+91-11-25556677', lat: 28.6260, lng: 77.0530, type: 'INDEPENDENT', is24Hours: false, hasDriveThrough: false, rating: 3.8, medicinesAvailable: ['paracetamol', 'cetirizine', 'ibuprofen'] },
  { id: 'ph-005', name: 'Wellness Forever - Rohini', address: 'Pocket B-3, Sector 8, Rohini, Delhi', district: 'North Delhi', city: 'New Delhi', state: 'Delhi', phone: '+91-11-27051122', lat: 28.7170, lng: 77.1170, type: 'CHAIN', is24Hours: true, hasDriveThrough: true, rating: 4.6, medicinesAvailable: ['paracetamol', 'amoxicillin', 'metformin', 'omeprazole', 'azithromycin', 'atorvastatin'] },
  // Mumbai
  { id: 'ph-006', name: 'Apollo Pharmacy - Andheri West', address: 'Shop 12, JP Road, Andheri West, Mumbai', district: 'Mumbai Suburban', city: 'Mumbai', state: 'Maharashtra', phone: '+91-22-26789012', lat: 19.1360, lng: 72.8290, type: 'CHAIN', is24Hours: true, hasDriveThrough: false, rating: 4.4, medicinesAvailable: ['paracetamol', 'amoxicillin', 'metformin', 'omeprazole', 'cetirizine'] },
  { id: 'ph-007', name: 'MedPlus - Dadar', address: '29, Senapati Bapat Marg, Dadar, Mumbai', district: 'Mumbai City', city: 'Mumbai', state: 'Maharashtra', phone: '+91-22-24321098', lat: 19.0170, lng: 72.8430, type: 'CHAIN', is24Hours: false, hasDriveThrough: false, rating: 4.1, medicinesAvailable: ['paracetamol', 'ibuprofen', 'cetirizine', 'azithromycin'] },
  { id: 'ph-008', name: 'Fortis Pharmacy - Mulund', address: 'Fortis Hospital, Mulund West, Mumbai', district: 'Mumbai Suburban', city: 'Mumbai', state: 'Maharashtra', phone: '+91-22-25678901', lat: 19.1750, lng: 72.9470, type: 'HOSPITAL', is24Hours: true, hasDriveThrough: false, rating: 4.7, medicinesAvailable: ['paracetamol', 'amoxicillin', 'metformin', 'omeprazole', 'azithromycin', 'atorvastatin', 'ibuprofen'] },
  // Bangalore
  { id: 'ph-009', name: 'Apollo Pharmacy - Koramangala', address: '80 Feet Road, Koramangala, Bangalore', district: 'Bangalore Urban', city: 'Bangalore', state: 'Karnataka', phone: '+91-80-25521098', lat: 12.9350, lng: 77.6240, type: 'CHAIN', is24Hours: true, hasDriveThrough: false, rating: 4.5, medicinesAvailable: ['paracetamol', 'amoxicillin', 'metformin', 'omeprazole', 'cetirizine', 'azithromycin'] },
  { id: 'ph-010', name: 'MedPlus - Whitefield', address: 'ITPL Main Road, Whitefield, Bangalore', district: 'Bangalore Urban', city: 'Bangalore', state: 'Karnataka', phone: '+91-80-28451098', lat: 12.9690, lng: 77.7500, type: 'CHAIN', is24Hours: false, hasDriveThrough: true, rating: 4.2, medicinesAvailable: ['paracetamol', 'omeprazole', 'atorvastatin', 'cetirizine'] },
  // Chennai
  { id: 'ph-011', name: 'Apollo Pharmacy - Anna Nagar', address: '2nd Avenue, Anna Nagar, Chennai', district: 'Chennai', city: 'Chennai', state: 'Tamil Nadu', phone: '+91-44-26201098', lat: 13.0870, lng: 80.2050, type: 'CHAIN', is24Hours: true, hasDriveThrough: false, rating: 4.6, medicinesAvailable: ['paracetamol', 'amoxicillin', 'metformin', 'omeprazole', 'azithromycin'] },
  { id: 'ph-012', name: 'Vivek Pharmacy - T Nagar', address: 'Usman Road, T Nagar, Chennai', district: 'Chennai', city: 'Chennai', state: 'Tamil Nadu', phone: '+91-44-24341098', lat: 13.0420, lng: 80.2330, type: 'INDEPENDENT', is24Hours: false, hasDriveThrough: false, rating: 4.0, medicinesAvailable: ['paracetamol', 'cetirizine', 'ibuprofen'] },
  // Kolkata
  { id: 'ph-013', name: 'Frank Ross - Salt Lake', address: 'BD-44, Salt Lake, Kolkata', district: 'Kolkata', city: 'Kolkata', state: 'West Bengal', phone: '+91-33-23561098', lat: 22.5730, lng: 88.4130, type: 'CHAIN', is24Hours: true, hasDriveThrough: false, rating: 4.3, medicinesAvailable: ['paracetamol', 'amoxicillin', 'omeprazole', 'cetirizine', 'metformin'] },
  { id: 'ph-014', name: 'All India Medical - Park Street', address: '57, Park Street, Kolkata', district: 'Kolkata', city: 'Kolkata', state: 'West Bengal', phone: '+91-33-22281098', lat: 22.5560, lng: 88.3500, type: 'INDEPENDENT', is24Hours: false, hasDriveThrough: false, rating: 3.9, medicinesAvailable: ['paracetamol', 'ibuprofen', 'azithromycin'] },
  // Hyderabad
  { id: 'ph-015', name: 'Apollo Pharmacy - Banjara Hills', address: 'Road No. 12, Banjara Hills, Hyderabad', district: 'Hyderabad', city: 'Hyderabad', state: 'Telangana', phone: '+91-40-23551098', lat: 17.4150, lng: 78.4450, type: 'CHAIN', is24Hours: true, hasDriveThrough: false, rating: 4.5, medicinesAvailable: ['paracetamol', 'amoxicillin', 'metformin', 'omeprazole', 'cetirizine', 'atorvastatin'] },
  { id: 'ph-016', name: 'MedPlus - HITEC City', address: 'Cyber Towers, HITEC City, Hyderabad', district: 'Hyderabad', city: 'Hyderabad', state: 'Telangana', phone: '+91-40-23121098', lat: 17.4440, lng: 78.3790, type: 'CHAIN', is24Hours: false, hasDriveThrough: true, rating: 4.4, medicinesAvailable: ['paracetamol', 'omeprazole', 'cetirizine', 'azithromycin', 'atorvastatin'] },
]

// ─── Haversine Distance ──────────────────────────────────────────

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ─── GET: Find Nearby Pharmacies ─────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const radius = parseFloat(searchParams.get('radius') || '5')
    const district = searchParams.get('district') || ''
    const medicineId = searchParams.get('medicineId') || ''
    const medicineName = searchParams.get('medicineName') || ''
    const type = searchParams.get('type') || ''
    const is24Hours = searchParams.get('is24Hours') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // If medicineId provided, look up medicine name from DB
    let resolvedMedicineName = medicineName.toLowerCase()
    if (medicineId && !medicineName) {
      const med = await db.medicine.findUnique({
        where: { id: medicineId },
        select: { name: true, genericName: true },
      })
      if (med) {
        resolvedMedicineName = (med.name || med.genericName || '').toLowerCase()
      }
    }

    // Filter pharmacies
    let filtered = [...MOCK_PHARMACIES]

    // Filter by district
    if (district) {
      const districtLower = district.toLowerCase()
      filtered = filtered.filter(p =>
        p.district.toLowerCase().includes(districtLower) ||
        p.city.toLowerCase().includes(districtLower) ||
        p.state.toLowerCase().includes(districtLower)
      )
    }

    // Filter by type
    if (type) {
      filtered = filtered.filter(p => p.type === type.toUpperCase())
    }

    // Filter by 24 hours
    if (is24Hours) {
      filtered = filtered.filter(p => p.is24Hours)
    }

    // Calculate distances and filter by radius
    let results: Array<Pharmacy & { distance: number; medicineAvailability?: { available: boolean; inStock: boolean; estimatedWaitMinutes: number } }> = []

    if (lat && lng) {
      results = filtered
        .map(p => ({ ...p, distance: haversineDistance(lat, lng, p.lat, p.lng) }))
        .filter(p => p.distance <= radius)
        .sort((a, b) => a.distance - b.distance)
    } else {
      results = filtered
        .map(p => ({ ...p, distance: 0 }))
    }

    // Add medicine availability info
    if (resolvedMedicineName) {
      results = results.map(p => {
        const available = p.medicinesAvailable.some(m =>
          m.includes(resolvedMedicineName) || resolvedMedicineName.includes(m)
        )
        return {
          ...p,
          medicineAvailability: {
            available,
            inStock: available,
            estimatedWaitMinutes: available ? 0 : Math.floor(Math.random() * 120) + 30,
          },
        }
      })
    }

    // Pagination
    const total = results.length
    const totalPages = Math.ceil(total / limit)
    const paginatedResults = results.slice((page - 1) * limit, page * limit)

    // Build response
    const pharmacyList = paginatedResults.map(p => ({
      id: p.id,
      name: p.name,
      address: p.address,
      district: p.district,
      city: p.city,
      state: p.state,
      phone: p.phone,
      lat: p.lat,
      lng: p.lng,
      distance: Math.round(p.distance * 10) / 10,
      type: p.type,
      is24Hours: p.is24Hours,
      hasDriveThrough: p.hasDriveThrough,
      rating: p.rating,
      medicineAvailability: p.medicineAvailability || undefined,
    }))

    return NextResponse.json({
      data: pharmacyList,
      pagination: { page, limit, total, totalPages },
      filters: {
        lat: lat || undefined,
        lng: lng || undefined,
        radius: radius || undefined,
        district: district || undefined,
        medicineName: resolvedMedicineName || undefined,
      },
    })
  } catch (error) {
    console.error('[PHARMACY_GET]', error)
    return NextResponse.json({ error: 'Failed to find pharmacies' }, { status: 500 })
  }
}
