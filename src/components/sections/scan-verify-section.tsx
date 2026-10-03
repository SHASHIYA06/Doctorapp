'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  Search,
  History,
  ShieldCheck,
  Package,
  FileCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/lib/store'
import { toast } from '@/hooks/use-toast'

interface ScanResultItem {
  id: string
  name: string
  manufacturer: string
  batchNo: string
  cdscoApproved: boolean
  expiryDate: string
  schedule: string
  atcCode: string
  scannedAt: string
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

const mockScanHistory: ScanResultItem[] = [
  {
    id: '1',
    name: 'Amoxicillin 500mg',
    manufacturer: 'Cipla Ltd',
    batchNo: 'CPL-2025-0847',
    cdscoApproved: true,
    expiryDate: '2027-03',
    schedule: 'Schedule H',
    atcCode: 'J01CA04',
    scannedAt: '2 min ago',
  },
  {
    id: '2',
    name: 'Metformin 500mg',
    manufacturer: 'Sun Pharma',
    batchNo: 'SUN-2025-1293',
    cdscoApproved: true,
    expiryDate: '2028-01',
    schedule: 'Schedule H',
    atcCode: 'A10BA02',
    scannedAt: '15 min ago',
  },
  {
    id: '3',
    name: 'Unknown Compound X',
    manufacturer: 'Unverified Lab',
    batchNo: 'UNK-2024-0001',
    cdscoApproved: false,
    expiryDate: '2025-06',
    schedule: 'Unscheduled',
    atcCode: 'N/A',
    scannedAt: '1 hr ago',
  },
]

export function ScanVerifySection() {
  const { scanResult, setScanResult } = useAppStore()
  const [barcodeInput, setBarcodeInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanHistory, setScanHistory] = useState<ScanResultItem[]>(mockScanHistory)
  const [lastResult, setLastResult] = useState<ScanResultItem | null>(null)

  const handleScan = useCallback(async () => {
    if (!barcodeInput.trim()) {
      toast({ title: 'Input Required', description: 'Enter a barcode or medicine name', variant: 'destructive' })
      return
    }
    setScanning(true)
    // Simulate scan verification
    setTimeout(() => {
      const isApproved = !barcodeInput.toLowerCase().includes('unknown')
      const result: ScanResultItem = {
        id: `scan-${Date.now()}`,
        name: barcodeInput || 'Scanned Medicine',
        manufacturer: isApproved ? 'Verified Manufacturer' : 'Unverified Source',
        batchNo: `BATCH-${Date.now().toString(36).toUpperCase()}`,
        cdscoApproved: isApproved,
        expiryDate: isApproved ? '2028-06' : '2025-01',
        schedule: isApproved ? 'Schedule H' : 'Unscheduled',
        atcCode: isApproved ? 'J01CA04' : 'N/A',
        scannedAt: 'Just now',
      }
      setLastResult(result)
      setScanResult(result)
      setScanHistory([result, ...scanHistory])
      setScanning(false)
      if (isApproved) {
        toast({ title: 'Verified ✓', description: `${result.name} is CDSCO approved` })
      } else {
        toast({ title: 'Not Verified ⚠', description: `${result.name} is NOT CDSCO approved`, variant: 'destructive' })
      }
    }, 1500)
  }, [barcodeInput, scanHistory, setScanResult])

  const handleCameraScan = useCallback(() => {
    setScanning(true)
    setTimeout(() => {
      const result: ScanResultItem = {
        id: `cam-${Date.now()}`,
        name: 'Paracetamol 500mg',
        manufacturer: 'Dolo Ltd (Camera Scan)',
        batchNo: 'DOL-2025-4521',
        cdscoApproved: true,
        expiryDate: '2027-12',
        schedule: 'Schedule H',
        atcCode: 'N02BE01',
        scannedAt: 'Just now',
      }
      setLastResult(result)
      setScanResult(result)
      setScanHistory([result, ...scanHistory])
      setScanning(false)
      toast({ title: 'Camera Scan Complete', description: 'Medicine verified via camera' })
    }, 2000)
  }, [scanHistory, setScanResult])

  return (
    <motion.div {...fadeSlide} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900">
            <ScanLine className="h-6 w-6 text-teal-700 dark:text-teal-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Medicine Scan & Verify</h2>
            <p className="text-sm text-muted-foreground">CDSCO-integrated barcode verification system</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 ml-auto">
          <ShieldCheck className="h-3 w-3" />
          CDSCO Registry Connected
        </Badge>
      </div>

      <Tabs defaultValue="scan" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="scan" className="gap-2">
            <ScanLine className="h-4 w-4" />
            Scan
          </TabsTrigger>
          <TabsTrigger value="result" className="gap-2">
            <FileCheck className="h-4 w-4" />
            Result
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="mt-4 space-y-4">
          {/* Scanner Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Barcode / Name Scanner</CardTitle>
              <CardDescription>Enter a barcode number, batch ID, or medicine name to verify against CDSCO registry</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Enter barcode (e.g., 8901234567890) or medicine name..."
                    className="pl-9"
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  />
                </div>
                <Button onClick={handleScan} disabled={scanning} className="gap-2 min-w-[120px]">
                  <ScanLine className="h-4 w-4" />
                  {scanning ? 'Scanning...' : 'Verify'}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleCameraScan} disabled={scanning} className="h-20 flex-col gap-2">
                  <Camera className="h-6 w-6" />
                  <span className="text-xs">Camera Scan</span>
                </Button>
                <Button variant="outline" disabled={scanning} className="h-20 flex-col gap-2">
                  <Package className="h-6 w-6" />
                  <span className="text-xs">Batch Lookup</span>
                </Button>
              </div>

              {scanning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 p-4 rounded-lg bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800"
                >
                  <div className="h-5 w-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-teal-700 dark:text-teal-300">Scanning against CDSCO registry...</span>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Scans', value: scanHistory.length.toString(), icon: ScanLine, color: 'text-teal-600' },
              { label: 'Verified', value: scanHistory.filter(s => s.cdscoApproved).length.toString(), icon: CheckCircle2, color: 'text-green-600' },
              { label: 'Flagged', value: scanHistory.filter(s => !s.cdscoApproved).length.toString(), icon: XCircle, color: 'text-red-600' },
              { label: 'CDSCO DB', value: '12,847', icon: ShieldCheck, color: 'text-amber-600' },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <div>
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="result" className="mt-4 space-y-4">
          {lastResult ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className={`border-2 ${lastResult.cdscoApproved ? 'border-green-300 dark:border-green-700' : 'border-red-300 dark:border-red-700'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{lastResult.name}</CardTitle>
                    {lastResult.cdscoApproved ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        CDSCO Approved
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        NOT Approved
                      </Badge>
                    )}
                  </div>
                  <CardDescription>Batch: {lastResult.batchNo}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Manufacturer</p>
                      <p className="text-sm font-medium">{lastResult.manufacturer}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Expiry Date</p>
                      <p className="text-sm font-medium">{lastResult.expiryDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Drug Schedule</p>
                      <Badge variant="outline">{lastResult.schedule}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">ATC Code</p>
                      <Badge variant="secondary">{lastResult.atcCode}</Badge>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center gap-2">
                    {lastResult.cdscoApproved ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700 dark:text-green-300">This medicine is verified and approved for use in India</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-700 dark:text-red-300">This medicine is NOT approved. Do not dispense.</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <ScanLine className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No scan result yet. Scan a medicine to see verification details.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scan History</CardTitle>
              <CardDescription>{scanHistory.length} recent scans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {scanHistory.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                      {item.cdscoApproved ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.batchNo} • {item.manufacturer}</p>
                      </div>
                      <Badge variant={item.cdscoApproved ? 'default' : 'destructive'} className="text-[10px] shrink-0">
                        {item.cdscoApproved ? 'Verified' : 'Flagged'}
                      </Badge>
                      <span className="text-xs text-muted-foreground shrink-0">{item.scannedAt}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
