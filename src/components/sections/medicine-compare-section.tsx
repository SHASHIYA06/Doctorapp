'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  GitCompare,
  BadgeIndianRupee,
  CheckCircle2,
  XCircle,
  TrendingDown,
  ArrowRight,
  Star,
  Building2,
  Pill,
  Tag,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { toast } from '@/hooks/use-toast'

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

interface MedicineInfo {
  id: string
  name: string
  genericName: string
  manufacturer: string
  mrp: number
  strength: string
  form: string
  isBrand: boolean
  cdscoApproved: boolean
  janAushadhiPrice: number | null
}

const medicineDatabase: MedicineInfo[] = [
  { id: '1', name: 'Crocin Advance', genericName: 'Paracetamol', manufacturer: 'GSK Consumer Healthcare', mrp: 35, strength: '500mg', form: 'Tablet', isBrand: true, cdscoApproved: true, janAushadhiPrice: 5 },
  { id: '2', name: 'Paracetamol (Generic)', genericName: 'Paracetamol', manufacturer: 'Various Generic Makers', mrp: 12, strength: '500mg', form: 'Tablet', isBrand: false, cdscoApproved: true, janAushadhiPrice: 5 },
  { id: '3', name: 'Dolo 650', genericName: 'Paracetamol', manufacturer: 'Micro Labs Ltd', mrp: 32, strength: '650mg', form: 'Tablet', isBrand: true, cdscoApproved: true, janAushadhiPrice: 7 },
  { id: '4', name: 'Metformin (Generic)', genericName: 'Metformin', manufacturer: 'USV Pvt Ltd', mrp: 18, strength: '500mg', form: 'Tablet', isBrand: false, cdscoApproved: true, janAushadhiPrice: 4 },
  { id: '5', name: 'Glycomet GP 1', genericName: 'Metformin + Glimepiride', manufacturer: 'USV Pvt Ltd', mrp: 95, strength: '500mg/1mg', form: 'Tablet', isBrand: true, cdscoApproved: true, janAushadhiPrice: null },
  { id: '6', name: 'Amlong 5', genericName: 'Amlodipine', manufacturer: 'Micro Labs Ltd', mrp: 62, strength: '5mg', form: 'Tablet', isBrand: true, cdscoApproved: true, janAushadhiPrice: 4 },
  { id: '7', name: 'Amlodipine (Generic)', genericName: 'Amlodipine', manufacturer: 'Various Generic Makers', mrp: 15, strength: '5mg', form: 'Tablet', isBrand: false, cdscoApproved: true, janAushadhiPrice: 4 },
  { id: '8', name: 'Azithral 500', genericName: 'Azithromycin', manufacturer: 'Alembic Pharma', mrp: 108, strength: '500mg', form: 'Tablet', isBrand: true, cdscoApproved: true, janAushadhiPrice: 22 },
  { id: '9', name: 'Cetirizine (Generic)', genericName: 'Cetirizine', manufacturer: 'Various Generic Makers', mrp: 10, strength: '10mg', form: 'Tablet', isBrand: false, cdscoApproved: true, janAushadhiPrice: 3 },
  { id: '10', name: 'Okacet', genericName: 'Cetirizine', manufacturer: 'Cipla Ltd', mrp: 38, strength: '10mg', form: 'Tablet', isBrand: true, cdscoApproved: true, janAushadhiPrice: 3 },
]

interface AlternativeMedicine {
  name: string
  genericName: string
  mrp: number
  savingsPercent: number
  janAushadhi: boolean
}

const mockAlternatives: AlternativeMedicine[] = [
  { name: 'Paracetamol 500mg (JP)', genericName: 'Paracetamol', mrp: 5, savingsPercent: 86, janAushadhi: true },
  { name: 'P-500', genericName: 'Paracetamol', mrp: 8, savingsPercent: 77, janAushadhi: false },
  { name: 'Febrinil', genericName: 'Paracetamol', mrp: 15, savingsPercent: 57, janAushadhi: false },
]

export function MedicineCompareSection() {
  const [brandId, setBrandId] = useState('1')
  const [genericId, setGenericId] = useState('2')
  const [alternatives, setAlternatives] = useState<AlternativeMedicine[]>(mockAlternatives)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState(false)

  const brandMed = medicineDatabase.find((m) => m.id === brandId)!
  const genericMed = medicineDatabase.find((m) => m.id === genericId)!

  // Fetch comparison from API when selection changes
  useEffect(() => {
    let cancelled = false
    async function fetchComparison() {
      setLoading(true)
      setError(false)
      try {
        const res = await fetch(`/api/compare?medicineA=${encodeURIComponent(brandMed.genericName.toLowerCase())}&medicineB=${encodeURIComponent(genericMed.genericName.toLowerCase())}`)
        if (!res.ok) throw new Error('Failed to fetch comparison')
        const json = await res.json()
        if (!cancelled && json?.data) {
          // Update alternatives from API if available
          const medA = json.data.medicineA as Record<string, unknown> | undefined
          const medB = json.data.medicineB as Record<string, unknown> | undefined
          if (medA && medB) {
            // Build alternatives list from API data
            const apiAlternatives: AlternativeMedicine[] = []
            if (medA.janAushadhiPrice && medA.janAushadhiPrice < medA.mrp) {
              apiAlternatives.push({
                name: `${medA.name as string} (Jan Aushadhi)`,
                genericName: medA.genericName as string,
                mrp: medA.janAushadhiPrice as number,
                savingsPercent: medA.savingsPercent as number || Math.round(((medA.mrp as number - (medA.janAushadhiPrice as number)) / medA.mrp as number) * 100),
                janAushadhi: true,
              })
            }
            if (medB.janAushadhiPrice && medB.janAushadhiPrice < medB.mrp) {
              apiAlternatives.push({
                name: `${medB.name as string} (Jan Aushadhi)`,
                genericName: medB.genericName as string,
                mrp: medB.janAushadhiPrice as number,
                savingsPercent: medB.savingsPercent as number || Math.round(((medB.mrp as number - (medB.janAushadhiPrice as number)) / medB.mrp as number) * 100),
                janAushadhi: true,
              })
            }
            if (apiAlternatives.length > 0) setAlternatives(apiAlternatives)
          }
        }
      } catch {
        if (!cancelled) {
          setError(true)
          toast({ title: 'Compare Error', description: 'Failed to load medicine comparison', variant: 'destructive' })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setInitialLoading(false)
        }
      }
    }
    fetchComparison()
    return () => { cancelled = true }
  }, [brandMed.genericName, genericMed.genericName])

  const savingsPercent = brandMed.mrp > 0 ? Math.round(((brandMed.mrp - genericMed.mrp) / brandMed.mrp) * 100) : 0
  const savingsAmount = Math.abs(brandMed.mrp - genericMed.mrp)

  const handleSwap = () => {
    setBrandId(genericId)
    setGenericId(brandId)
    toast({ title: 'Swapped', description: 'Brand and generic medicines swapped' })
  }

  const comparisonFields = [
    { label: 'Name', brandVal: brandMed.name, genericVal: genericMed.name },
    { label: 'Generic Name', brandVal: brandMed.genericName, genericVal: genericMed.genericName },
    { label: 'Manufacturer', brandVal: brandMed.manufacturer, genericVal: genericMed.manufacturer },
    { label: 'MRP', brandVal: `₹${brandMed.mrp}`, genericVal: `₹${genericMed.mrp}` },
    { label: 'Strength', brandVal: brandMed.strength, genericVal: genericMed.strength },
    { label: 'Form', brandVal: brandMed.form, genericVal: genericMed.form },
  ]

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-64" /></div>
        </div>
        <Card><CardContent className="p-4 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent></Card>
        <Card><CardContent className="p-6 space-y-3"><Skeleton className="h-8 w-32 mx-auto" /><Skeleton className="h-4 w-48 mx-auto" /></CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeSlide}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
            <GitCompare className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Medicine Comparison</h2>
            <p className="text-sm text-muted-foreground">Compare Brand vs Generic medicines and find savings</p>
          </div>
        </div>
      </motion.div>

      {/* Selectors */}
      <motion.div {...fadeSlide} transition={{ delay: 0.05 }}>
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
              <div className="space-y-2">
                <Label className="font-semibold">Brand Medicine</Label>
                <Select value={brandId} onValueChange={setBrandId}>
                  <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>
                    {medicineDatabase.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name} (₹{m.mrp})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon" className="hidden md:flex" onClick={handleSwap}>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <div className="space-y-2">
                <Label className="font-semibold">Generic Medicine</Label>
                <Select value={genericId} onValueChange={setGenericId}>
                  <SelectTrigger><SelectValue placeholder="Select generic" /></SelectTrigger>
                  <SelectContent>
                    {medicineDatabase.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name} (₹{m.mrp})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Savings Display */}
      <motion.div {...fadeSlide} transition={{ delay: 0.1 }}>
        <Card className={`border-2 ${savingsPercent > 0 ? 'border-green-400 dark:border-green-600' : 'border-muted'}`}>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {savingsPercent > 0 ? <TrendingDown className="h-6 w-6 text-green-600" /> : <AlertCircle className="h-6 w-6 text-amber-500" />}
              <span className="text-4xl font-bold text-green-600">{savingsPercent > 0 ? savingsPercent : 0}%</span>
              <span className="text-lg text-muted-foreground">Savings</span>
            </div>
            <p className="text-sm text-muted-foreground">
              You save <span className="font-semibold text-green-600">₹{savingsAmount}</span> per strip by choosing the {savingsPercent > 0 ? 'generic' : 'selected'} option
            </p>
            {brandMed.janAushadhiPrice && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                <Tag className="h-4 w-4" />
                <span className="text-sm font-medium">Jan Aushadhi Price: ₹{brandMed.janAushadhiPrice}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Comparison Table */}
      <motion.div {...fadeSlide} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detailed Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {comparisonFields.map((field, idx) => (
                <div key={field.label}>
                  <div className="grid grid-cols-3 gap-4 py-3 items-center">
                    <div className="text-sm font-medium text-right text-muted-foreground">{field.brandVal}</div>
                    <div className="text-center text-xs font-semibold text-muted-foreground uppercase">{field.label}</div>
                    <div className="text-sm font-medium text-left">{field.genericVal}</div>
                  </div>
                  {idx < comparisonFields.length - 1 && <Separator />}
                </div>
              ))}
              {/* CDSCO Row */}
              <Separator />
              <div className="grid grid-cols-3 gap-4 py-3 items-center">
                <div className="flex items-center justify-end gap-1">
                  {brandMed.cdscoApproved ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-500" />}
                  <span className="text-sm">Approved</span>
                </div>
                <div className="text-center text-xs font-semibold text-muted-foreground uppercase">CDSCO Status</div>
                <div className="flex items-center gap-1">
                  {genericMed.cdscoApproved ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-500" />}
                  <span className="text-sm">Approved</span>
                </div>
              </div>
              {/* Jan Aushadhi Row */}
              <Separator />
              <div className="grid grid-cols-3 gap-4 py-3 items-center">
                <div className="text-sm text-right">
                  {brandMed.janAushadhiPrice ? (
                    <span className="text-orange-600 font-medium">₹{brandMed.janAushadhiPrice}</span>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </div>
                <div className="text-center text-xs font-semibold text-muted-foreground uppercase">Jan Aushadhi</div>
                <div className="text-sm">
                  {genericMed.janAushadhiPrice ? (
                    <span className="text-orange-600 font-medium">₹{genericMed.janAushadhiPrice}</span>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alternative Medicines */}
      <motion.div {...fadeSlide} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Pill className="h-5 w-5 text-violet-600" />
              Alternative Medicines
            </CardTitle>
            <CardDescription>Other options with similar generic composition</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-64 overflow-y-auto">
            {alternatives.map((alt, idx) => (
              <motion.div
                key={alt.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{alt.name}</span>
                    {alt.janAushadhi && (
                      <Badge variant="outline" className="text-xs border-orange-400 text-orange-600">
                        <Tag className="h-3 w-3 mr-1" /> Jan Aushadhi
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{alt.genericName} • MRP: ₹{alt.mrp}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-green-600 text-sm">{alt.savingsPercent}% savings</p>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
