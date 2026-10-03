'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, UserPlus, X, ChevronRight, Pill, AlertTriangle, Stethoscope, ClipboardList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { ModalityBadge } from '@/components/clinical/modality-badge'
import { toast } from '@/hooks/use-toast'

interface Patient {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string | null
  gender: string | null
  phone: string | null
  email: string | null
  bloodGroup: string | null
  isActive: boolean
  createdAt: string
  encounters?: Array<{ id: string; status: string; modality: string; createdAt: string }>
  allergies?: Array<{ id: string; substance: string; reaction: string | null; severity: string }>
  medicationStatements?: Array<{ id: string; medication: string; dosage: string | null; isActive: boolean }>
  conditions?: Array<{ id: string; name: string; status: string }>
  consents?: Array<{ id: string; type: string; status: string; modality: string }>
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

export function PatientsSection() {
  const { selectedPatientId, setSelectedPatientId, setActiveSection } = useAppStore()
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Form state
  const [formFirstName, setFormFirstName] = useState('')
  const [formLastName, setFormLastName] = useState('')
  const [formDOB, setFormDOB] = useState('')
  const [formGender, setFormGender] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formBloodGroup, setFormBloodGroup] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)

  const loadPatients = useCallback(async () => {
    try {
      const res = await fetch('/api/patients')
      const json = await res.json()
      const list = json.data ?? json.patients ?? []
      setPatients(list)
      setFilteredPatients(list)
    } catch {
      toast({ title: 'Error', description: 'Failed to load patients', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPatients() }, [loadPatients])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPatients(patients)
    } else {
      const q = searchQuery.toLowerCase()
      setFilteredPatients(
        patients.filter(
          (p) =>
            p.firstName.toLowerCase().includes(q) ||
            p.lastName.toLowerCase().includes(q) ||
            (p.email ?? '').toLowerCase().includes(q)
        )
      )
    }
  }, [searchQuery, patients])

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatientId(patient.id)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/patients/${patient.id}`)
      const data = await res.json()
      setSelectedPatient(data.data ?? data.patient ?? patient)
    } catch {
      setSelectedPatient(patient)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleAddPatient = async () => {
    if (!formFirstName.trim() || !formLastName.trim()) {
      toast({ title: 'Validation Error', description: 'First name and last name are required', variant: 'destructive' })
      return
    }
    setFormSubmitting(true)
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formFirstName,
          lastName: formLastName,
          dateOfBirth: formDOB || null,
          gender: formGender || null,
          phone: formPhone || null,
          email: formEmail || null,
          bloodGroup: formBloodGroup || null,
        }),
      })
      if (res.ok) {
        toast({ title: 'Patient Added', description: `${formFirstName} ${formLastName} registered` })
        setAddDialogOpen(false)
        setFormFirstName(''); setFormLastName(''); setFormDOB(''); setFormGender('')
        setFormPhone(''); setFormEmail(''); setFormBloodGroup('')
        loadPatients()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error ?? 'Failed to add patient', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setFormSubmitting(false)
    }
  }

  const getAge = (dob: string | null) => {
    if (!dob) return '-'
    const diff = Date.now() - new Date(dob).getTime()
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    )
  }

  return (
    <motion.div {...fadeSlide} className="space-y-4">
      {/* Search & Add */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Register New Patient</DialogTitle>
              <DialogDescription>Enter patient demographic information</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" value={formLastName} onChange={(e) => setFormLastName(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" value={formDOB} onChange={(e) => setFormDOB(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={formGender} onValueChange={setFormGender}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Select value={formBloodGroup} onValueChange={setFormBloodGroup}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddPatient} disabled={formSubmitting}>
                {formSubmitting ? 'Saving...' : 'Register Patient'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Patient List + Detail */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Patient Table */}
        <div className={selectedPatient ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Age</TableHead>
                    <TableHead className="hidden md:table-cell">Gender</TableHead>
                    <TableHead className="hidden md:table-cell">Blood Group</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Actions</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow
                      key={patient.id}
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedPatientId === patient.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => handleSelectPatient(patient)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0" aria-label={`${patient.firstName} ${patient.lastName} avatar`}>
                            {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium text-sm">{patient.firstName} {patient.lastName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {patient.medicationStatements && patient.medicationStatements.filter((m) => m.isActive).length > 0 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800 gap-0.5">
                                  <Pill className="h-2.5 w-2.5" />{patient.medicationStatements.filter((m) => m.isActive).length} med{patient.medicationStatements.filter((m) => m.isActive).length !== 1 ? 's' : ''}
                                </Badge>
                              )}
                              {patient.allergies && patient.allergies.length > 0 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800 gap-0.5">
                                  <AlertTriangle className="h-2.5 w-2.5" />{patient.allergies.length} allergy{patient.allergies.length !== 1 ? 'ies' : 'y'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {getAge(patient.dateOfBirth)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {patient.gender ?? '-'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {patient.bloodGroup ?? '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={patient.isActive ? 'default' : 'secondary'} className="text-xs">
                          {patient.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedPatientId(patient.id)
                              setActiveSection('safety')
                            }}
                          >
                            <Stethoscope className="h-3 w-3" />
                            Triage
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedPatientId(patient.id)
                              setActiveSection('care-plans')
                            }}
                          >
                            <ClipboardList className="h-3 w-3" />
                            Care Plan
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPatients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No patients found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Patient Detail Panel */}
        <AnimatePresence>
          {selectedPatient && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-1"
            >
              <Card className="sticky top-4">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedPatient(null); setSelectedPatientId(null) }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    DOB: {selectedPatient.dateOfBirth ?? '-'} • {selectedPatient.gender ?? '-'} • {selectedPatient.bloodGroup ?? '-'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {detailLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : (
                    <ScrollArea className="max-h-80">
                      <div className="space-y-4">
                        {/* Allergies */}
                        <div>
                          <p className="text-sm font-semibold mb-2">Allergies</p>
                          {(selectedPatient.allergies?.length ?? 0) === 0 ? (
                            <p className="text-xs text-muted-foreground">No known allergies</p>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {selectedPatient.allergies?.map((a) => (
                                <Badge key={a.id} variant="outline" className="text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                                  {a.substance}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Separator />
                        {/* Medications */}
                        <div>
                          <p className="text-sm font-semibold mb-2">Medications</p>
                          {(selectedPatient.medicationStatements?.length ?? 0) === 0 ? (
                            <p className="text-xs text-muted-foreground">No active medications</p>
                          ) : (
                            <div className="space-y-1">
                              {selectedPatient.medicationStatements?.filter((m) => m.isActive).map((m) => (
                                <div key={m.id} className="flex items-center gap-2 text-xs">
                                  <span className="font-medium">{m.medication}</span>
                                  {m.dosage && <span className="text-muted-foreground">{m.dosage}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <Separator />
                        {/* Conditions */}
                        <div>
                          <p className="text-sm font-semibold mb-2">Conditions</p>
                          {(selectedPatient.conditions?.length ?? 0) === 0 ? (
                            <p className="text-xs text-muted-foreground">No active conditions</p>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {selectedPatient.conditions?.map((c) => (
                                <Badge key={c.id} variant="outline" className="text-xs">
                                  {c.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Separator />
                        {/* Consents */}
                        <div>
                          <p className="text-sm font-semibold mb-2">Consents</p>
                          {(selectedPatient.consents?.length ?? 0) === 0 ? (
                            <p className="text-xs text-muted-foreground">No consents on file</p>
                          ) : (
                            <div className="space-y-1">
                              {selectedPatient.consents?.map((c) => (
                                <div key={c.id} className="flex items-center gap-2 text-xs">
                                  <ModalityBadge modality={c.modality} className="text-[10px]" />
                                  <span>{c.type}</span>
                                  <Badge variant="outline" className={`text-[10px] ${
                                    c.status === 'GRANTED' ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' :
                                    c.status === 'PENDING' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                                    'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                                  }`}>
                                    {c.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
