'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  MapPin,
  Search,
  Phone,
  Clock,
  Navigation,
  Star,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { toast } from '@/hooks/use-toast'

interface Pharmacy {
  id: string
  name: string
  address: string
  city: string
  district: string
  phone: string
  distance: number
  rating: number
  isOpen: boolean
  hasCdscoLicense: boolean
  specialties: string[]
  openHours: string
  availableMeds: number
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

const mockPharmacies: Pharmacy[] = [
  {
    id: '1',
    name: 'Apollo Pharmacy - Koramangala',
    address: '123 5th Cross, Koramangala',
    city: 'Bangalore',
    district: 'Bangalore Urban',
    phone: '+91-80-2553-4567',
    distance: 0.8,
    rating: 4.6,
    isOpen: true,
    hasCdscoLicense: true,
    specialties: ['General', 'Cardiology', 'Diabetes'],
    openHours: '8:00 AM - 10:00 PM',
    availableMeds: 2450,
  },
  {
    id: '2',
    name: 'MedPlus - Indiranagar',
    address: '456 100ft Road, Indiranagar',
    city: 'Bangalore',
    district: 'Bangalore Urban',
    phone: '+91-80-4152-7890',
    distance: 2.1,
    rating: 4.3,
    isOpen: true,
    hasCdscoLicense: true,
    specialties: ['General', 'Ayurvedic', 'Homeopathic'],
    openHours: '7:00 AM - 11:00 PM',
    availableMeds: 3200,
  },
  {
    id: '3',
    name: 'Netmeds Express - HSR Layout',
    address: '789 17th Cross, HSR Layout',
    city: 'Bangalore',
    district: 'Bangalore Urban',
    phone: '+91-80-6745-1234',
    distance: 3.5,
    rating: 4.1,
    isOpen: true,
    hasCdscoLicense: true,
    specialties: ['General', 'Pediatric', 'Dermatology'],
    openHours: '9:00 AM - 9:00 PM',
    availableMeds: 1800,
  },
  {
    id: '4',
    name: 'Local Care Pharmacy',
    address: '12 MG Road',
    city: 'Bangalore',
    district: 'Bangalore Urban',
    phone: '+91-80-2550-9999',
    distance: 5.2,
    rating: 3.8,
    isOpen: false,
    hasCdscoLicense: false,
    specialties: ['General'],
    openHours: '10:00 AM - 8:00 PM',
    availableMeds: 650,
  },
  {
    id: '5',
    name: '1mg Pharmacy - Whitefield',
    address: '321 ITPL Road, Whitefield',
    city: 'Bangalore',
    district: 'Bangalore Urban',
    phone: '+91-80-4567-8901',
    distance: 8.7,
    rating: 4.4,
    isOpen: true,
    hasCdscoLicense: true,
    specialties: ['General', 'Oncology', 'Neurology'],
    openHours: '24 Hours',
    availableMeds: 4100,
  },
]

export function PharmacySection() {
  const { selectedPharmacyId, setSelectedPharmacyId } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [licenseFilter, setLicenseFilter] = useState('all')

  const filteredPharmacies = useMemo(() => {
    let results = mockPharmacies
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.specialties.some((s) => s.toLowerCase().includes(q))
      )
    }
    if (districtFilter !== 'all') {
      results = results.filter((p) => p.district === districtFilter)
    }
    if (licenseFilter === 'cdsco') {
      results = results.filter((p) => p.hasCdscoLicense)
    }
    return results.sort((a, b) => a.distance - b.distance)
  }, [searchQuery, districtFilter, licenseFilter])

  const selectedPharmacy = mockPharmacies.find((p) => p.id === selectedPharmacyId)

  const handleNavigate = (pharmacy: Pharmacy) => {
    toast({ title: 'Opening Maps', description: `Navigating to ${pharmacy.name}` })
  }

  return (
    <motion.div {...fadeSlide} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
            <MapPin className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Pharmacy Finder</h2>
            <p className="text-sm text-muted-foreground">Locate CDSCO-licensed pharmacies near you</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 ml-auto">
          <Navigation className="h-3 w-3" />
          Location: Bangalore Urban
        </Badge>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pharmacies by name, area, or specialty..."
                className="pl-9"
              />
            </div>
            <Select value={districtFilter} onValueChange={setDistrictFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue placeholder="District" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                <SelectItem value="Bangalore Urban">Bangalore Urban</SelectItem>
              </SelectContent>
            </Select>
            <Select value={licenseFilter} onValueChange={setLicenseFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="License" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pharmacies</SelectItem>
                <SelectItem value="cdsco">CDSCO Licensed Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pharmacy List */}
        <div className="lg:col-span-2 space-y-3">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                <div>
                  <p className="text-lg font-bold">{filteredPharmacies.length}</p>
                  <p className="text-[10px] text-muted-foreground">Found</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-lg font-bold">{filteredPharmacies.filter(p => p.hasCdscoLicense).length}</p>
                  <p className="text-[10px] text-muted-foreground">CDSCO Licensed</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-lg font-bold">{filteredPharmacies.filter(p => p.isOpen).length}</p>
                  <p className="text-[10px] text-muted-foreground">Open Now</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-lg font-bold">{filteredPharmacies.filter(p => !p.hasCdscoLicense).length}</p>
                  <p className="text-[10px] text-muted-foreground">Unlicensed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pharmacy Cards */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredPharmacies.map((pharmacy, i) => (
              <motion.div
                key={pharmacy.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedPharmacyId === pharmacy.id ? 'ring-2 ring-emerald-500' : ''
                  }`}
                  onClick={() => setSelectedPharmacyId(pharmacy.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 shrink-0">
                        <MapPin className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold truncate">{pharmacy.name}</h3>
                          {pharmacy.isOpen ? (
                            <Badge variant="default" className="text-[10px] bg-green-600">Open</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Closed</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{pharmacy.address}, {pharmacy.city}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Navigation className="h-3 w-3" />
                            {pharmacy.distance} km
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-500" />
                            {pharmacy.rating}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {pharmacy.openHours}
                          </span>
                          {pharmacy.hasCdscoLicense ? (
                            <Badge className="text-[9px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 gap-0.5">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              CDSCO
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[9px] gap-0.5">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              No License
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleNavigate(pharmacy) }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          {selectedPharmacy ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={selectedPharmacy.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{selectedPharmacy.name}</CardTitle>
                  <CardDescription>{selectedPharmacy.address}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedPharmacy.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedPharmacy.openHours}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedPharmacy.distance} km away</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">{selectedPharmacy.rating} / 5.0</span>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Specialties</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedPharmacy.specialties.map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Available Medicines</p>
                    <p className="text-lg font-bold text-emerald-600">{selectedPharmacy.availableMeds.toLocaleString()}</p>
                  </div>
                  <Button className="w-full gap-2" onClick={() => handleNavigate(selectedPharmacy)}>
                    <Navigation className="h-4 w-4" />
                    Get Directions
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">Select a pharmacy to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  )
}
