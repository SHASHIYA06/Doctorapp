'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Fingerprint,
  Link2,
  Unlink,
  User,
  Phone,
  MapPin,
  Calendar,
  FileText,
  ShieldCheck,
  Stethoscope,
  FlaskConical,
  Plus,
  BadgeCheck,
  Heart,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { toast } from '@/hooks/use-toast'

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

interface HealthRecord {
  id: string
  type: 'verification' | 'prescription' | 'lab_report'
  title: string
  date: string
  provider: string
  status: string
}

const fallbackHealthRecords: HealthRecord[] = [
  { id: '1', type: 'verification', title: 'Identity Verification - Aadhaar', date: '2026-09-15', provider: 'UIDAI', status: 'verified' },
  { id: '2', type: 'prescription', title: 'Prescription - Metformin 500mg', date: '2026-09-20', provider: 'AIIMS Delhi', status: 'active' },
  { id: '3', type: 'lab_report', title: 'Blood Test - Fasting Glucose', date: '2026-09-18', provider: 'SRL Diagnostics', status: 'completed' },
  { id: '4', type: 'prescription', title: 'Prescription - Amlodipine 5mg', date: '2026-08-30', provider: 'Fortis Hospital', status: 'completed' },
  { id: '5', type: 'lab_report', title: 'Lipid Profile', date: '2026-08-25', provider: 'Thyrocare', status: 'completed' },
  { id: '6', type: 'verification', title: 'Mobile Verification', date: '2026-09-14', provider: 'NHA', status: 'verified' },
]

const recordTypeIcon = (type: string) => {
  switch (type) {
    case 'verification': return <ShieldCheck className="h-4 w-4 text-emerald-600" />
    case 'prescription': return <Stethoscope className="h-4 w-4 text-blue-600" />
    case 'lab_report': return <FlaskConical className="h-4 w-4 text-purple-600" />
    default: return <FileText className="h-4 w-4" />
  }
}

export function AbhaSection() {
  const { isAbhaLinked, setIsAbhaLinked, selectedPatientId } = useAppStore()
  const [abhaNumber, setAbhaNumber] = useState('')
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>(fallbackHealthRecords)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      setLoading(true)
      setError(false)
      try {
        const patientId = selectedPatientId || 'demo'
        const res = await fetch(`/api/abha?patientId=${patientId}`)
        if (!res.ok) throw new Error('Failed to fetch ABHA data')
        const json = await res.json()
        if (!cancelled && json?.data) {
          if (json.data.isLinked) {
            setIsAbhaLinked(true)
          }
          // Map records if available
          const records = json.data.linkDetails?.recentRecords || []
          if (records.length > 0) {
            const mapped: HealthRecord[] = records.map((r: Record<string, unknown>, i: number) => ({
              id: (r.id as string) || String(i),
              type: ((r.recordType as string) || 'verification') as HealthRecord['type'],
              title: (r.title as string) || 'Health Record',
              date: r.createdAt ? new Date(r.createdAt as string).toISOString().split('T')[0] : '',
              provider: (r.source as string) || 'ABDM',
              status: r.verifiedAt ? 'verified' : 'pending',
            }))
            setHealthRecords(mapped)
          }
        }
      } catch {
        if (!cancelled) {
          setError(true)
          toast({ title: 'ABHA Error', description: 'Failed to load ABHA data', variant: 'destructive' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [selectedPatientId, setIsAbhaLinked])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-64" /></div>
        </div>
        <Card><CardContent className="p-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-full" /></div>))}</CardContent></Card>
      </div>
    )
  }

  const handleLink = () => {
    if (abhaNumber.length !== 14) {
      toast({ title: 'Invalid ABHA Number', description: 'ABHA number must be 14 digits', variant: 'destructive' })
      return
    }
    setIsAbhaLinked(true)
    toast({ title: 'ABHA Linked Successfully', description: 'Your health account is now connected' })
  }

  const handleUnlink = () => {
    setIsAbhaLinked(false)
    setAbhaNumber('')
    toast({ title: 'ABHA Unlinked', description: 'Your health account has been disconnected' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeSlide}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <Fingerprint className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">ABHA Health Account</h2>
            <p className="text-sm text-muted-foreground">Ayushman Bharat Health Account — Your digital health identity</p>
          </div>
          <Badge variant="outline" className="ml-auto border-emerald-500 text-emerald-600">
            {isAbhaLinked ? 'Linked' : 'Not Linked'}
          </Badge>
        </div>
      </motion.div>

      {/* Link/Unlink Form */}
      <motion.div {...fadeSlide} transition={{ delay: 0.05 }}>
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link2 className="h-5 w-5 text-emerald-600" />
              {isAbhaLinked ? 'Linked ABHA Account' : 'Link Your ABHA Number'}
            </CardTitle>
            <CardDescription>
              {isAbhaLinked
                ? 'Your ABHA health account is connected to this profile'
                : 'Enter your 14-digit ABHA number to link your health records'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isAbhaLinked ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="abha-number">ABHA Number (14 digits)</Label>
                  <Input
                    id="abha-number"
                    placeholder="e.g. 91-1234-5678-9012"
                    value={abhaNumber}
                    onChange={(e) => setAbhaNumber(e.target.value.replace(/\D/g, '').slice(14))}
                    maxLength={14}
                    className="font-mono text-lg tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground">{abhaNumber.length}/14 digits entered</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleLink} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Link2 className="h-4 w-4 mr-2" />
                    Link ABHA
                  </Button>
                  <Button variant="outline" onClick={() => setShowGenerateForm(!showGenerateForm)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate New ABHA
                  </Button>
                </div>
                {showGenerateForm && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200">
                    <p className="font-medium text-emerald-800 dark:text-emerald-300 mb-2">Generate ABHA using</p>
                    <div className="flex gap-3">
                      <Button size="sm" variant="outline" className="border-emerald-400">
                        <BadgeCheck className="h-4 w-4 mr-1" /> Aadhaar
                      </Button>
                      <Button size="sm" variant="outline" className="border-emerald-400">
                        <Phone className="h-4 w-4 mr-1" /> Mobile
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Button variant="destructive" size="sm" onClick={handleUnlink}>
                  <Unlink className="h-4 w-4 mr-2" />
                  Unlink ABHA
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Linked Profile & ID Card */}
      {isAbhaLinked && (
        <>
          <motion.div {...fadeSlide} transition={{ delay: 0.1 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-emerald-600" />
                    Linked Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-20">Name</span>
                    <span className="font-medium">Priya Sharma</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-20">Gender</span>
                    <span className="font-medium">Female</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">DOB:</span>
                    <span className="font-medium">15-Mar-1992</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">+91 98765 43210</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">HNo 42, Sector 15, Noida, Uttar Pradesh - 201301</span>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-muted-foreground">Health ID:</span>
                    <span className="font-mono font-bold text-emerald-600">priya.sharma@abha</span>
                  </div>
                </CardContent>
              </Card>

              {/* ABHA ID Card */}
              <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-6 w-6" />
                      <span className="font-bold text-lg">ABHA</span>
                    </div>
                    <Badge className="bg-white/20 text-white border-0">ID Card</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-lg">Priya Sharma</p>
                    <p>Health ID: <span className="font-mono">priya.sharma@abha</span></p>
                    <p>ABHA No: <span className="font-mono">91-1234-5678-9012</span></p>
                    <p>DOB: 15-Mar-1992 | Female</p>
                    <p className="opacity-80 text-xs mt-2">Ayushman Bharat Digital Mission</p>
                    <p className="opacity-60 text-xs">National Health Authority, Govt. of India</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Health Records */}
          <motion.div {...fadeSlide} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Health Records
                </CardTitle>
                <CardDescription>Records linked to your ABHA account</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All ({healthRecords.length})</TabsTrigger>
                    <TabsTrigger value="prescription">Prescriptions</TabsTrigger>
                    <TabsTrigger value="lab_report">Lab Reports</TabsTrigger>
                    <TabsTrigger value="verification">Verifications</TabsTrigger>
                  </TabsList>
                  {['all', 'prescription', 'lab_report', 'verification'].map((tab) => (
                    <TabsContent key={tab} value={tab}>
                      <div className="space-y-3">
                        {healthRecords
                          .filter((r) => tab === 'all' || r.type === tab)
                          .map((record, idx) => (
                            <motion.div
                              key={record.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors"
                            >
                              {recordTypeIcon(record.type)}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{record.title}</p>
                                <p className="text-xs text-muted-foreground">{record.provider} • {record.date}</p>
                              </div>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {record.status}
                              </Badge>
                            </motion.div>
                          ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  )
}
