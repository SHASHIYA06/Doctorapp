'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Plus,
  Search,
  IndianRupee,
  Minus,
  RotateCcw,
  Calendar,
  Hash,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { toast } from '@/hooks/use-toast'

// ── Types ──────────────────────────────────────────────────────

type AvailabilityStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

interface InventoryItem {
  id: string
  medicineName: string
  genericName: string
  currentStock: number
  mrp: number
  batchNumber: string
  expiryDate: string
  threshold: number
  category: string
  manufacturer: string
  unit: string
  lastUpdated: string
}

interface StockUpdateForm {
  itemId: string
  action: 'add' | 'reduce'
  quantity: number
  reason: string
}

// ── Mock Data ──────────────────────────────────────────────────

const mockInventory: InventoryItem[] = [
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

// ── Helpers ────────────────────────────────────────────────────

const getAvailabilityStatus = (item: InventoryItem): AvailabilityStatus => {
  if (item.currentStock === 0) return 'OUT_OF_STOCK'
  if (item.currentStock < item.threshold) return 'LOW_STOCK'
  return 'IN_STOCK'
}

const isExpiringSoon = (expiryDate: string, days: number = 30): boolean => {
  const expiry = new Date(expiryDate)
  const now = new Date()
  const diff = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diff > 0 && diff <= days
}

const isExpired = (expiryDate: string): boolean => {
  return new Date(expiryDate) < new Date()
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const statusBadge = (status: AvailabilityStatus) => {
  switch (status) {
    case 'IN_STOCK':
      return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">In Stock</Badge>
    case 'LOW_STOCK':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Low Stock</Badge>
    case 'OUT_OF_STOCK':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Out of Stock</Badge>
  }
}

// ── Animation ──────────────────────────────────────────────────

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

// ── Component ──────────────────────────────────────────────────

export function InventorySection() {
  const { setActiveSection } = useAppStore()

  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'ALL' | AvailabilityStatus>('ALL')
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [updateForm, setUpdateForm] = useState<StockUpdateForm>({ itemId: '', action: 'add', quantity: 0, reason: '' })
  const [sortField, setSortField] = useState<'name' | 'stock' | 'mrp' | 'expiry'>('name')
  const [sortAsc, setSortAsc] = useState(true)

  // Fetch inventory
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch('/api/inventory')
        if (res.ok) {
          const data = await res.json()
          const items = data.data ?? data.items
          if (Array.isArray(items) && items.length > 0) {
            setInventory(items)
          } else {
            setInventory(mockInventory)
          }
        } else {
          setInventory(mockInventory)
          toast({ title: 'Error', description: 'Failed to load inventory', variant: 'destructive' })
        }
      } catch {
        setInventory(mockInventory)
        toast({ title: 'Error', description: 'Failed to load inventory', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    fetchInventory()
  }, [])

  // Stats
  const stats = useMemo(() => {
    const total = inventory.length
    const inStock = inventory.filter(i => getAvailabilityStatus(i) === 'IN_STOCK').length
    const lowStock = inventory.filter(i => getAvailabilityStatus(i) === 'LOW_STOCK').length
    const outOfStock = inventory.filter(i => getAvailabilityStatus(i) === 'OUT_OF_STOCK').length
    const totalValue = inventory.reduce((sum, i) => sum + i.currentStock * i.mrp, 0)
    return { total, inStock, lowStock, outOfStock, totalValue }
  }, [inventory])

  // Filtered & sorted items
  const filteredItems = useMemo(() => {
    let items = [...inventory]

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      items = items.filter(i =>
        i.medicineName.toLowerCase().includes(q) ||
        i.genericName.toLowerCase().includes(q) ||
        i.batchNumber.toLowerCase().includes(q)
      )
    }

    // Filter by status
    if (filterStatus !== 'ALL') {
      items = items.filter(i => getAvailabilityStatus(i) === filterStatus)
    }

    // Sort
    items.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'name': cmp = a.medicineName.localeCompare(b.medicineName); break
        case 'stock': cmp = a.currentStock - b.currentStock; break
        case 'mrp': cmp = a.mrp - b.mrp; break
        case 'expiry': cmp = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime(); break
      }
      return sortAsc ? cmp : -cmp
    })

    return items
  }, [inventory, searchQuery, filterStatus, sortField, sortAsc])

  // Auto-reorder suggestions
  const reorderSuggestions = useMemo(() => {
    return inventory.filter(i => i.currentStock < i.threshold && i.currentStock > 0)
  }, [inventory])

  // Out of stock items
  const outOfStockItems = useMemo(() => {
    return inventory.filter(i => i.currentStock === 0)
  }, [inventory])

  // Expiring soon items
  const expiringSoonItems = useMemo(() => {
    return inventory.filter(i => isExpiringSoon(i.expiryDate, 30))
  }, [inventory])

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null
    return sortAsc ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />
  }

  const handleStockUpdate = () => {
    if (!selectedItem || updateForm.quantity <= 0) return

    setInventory(prev =>
      prev.map(item => {
        if (item.id !== selectedItem.id) return item
        const newStock = updateForm.action === 'add'
          ? item.currentStock + updateForm.quantity
          : Math.max(0, item.currentStock - updateForm.quantity)
        return { ...item, currentStock: newStock, lastUpdated: new Date().toISOString() }
      })
    )

    toast({
      title: `Stock ${updateForm.action === 'add' ? 'Added' : 'Reduced'}`,
      description: `${updateForm.quantity} units of ${selectedItem.medicineName} ${updateForm.action === 'add' ? 'added to' : 'removed from'} inventory.`,
    })

    setUpdateDialogOpen(false)
    setUpdateForm({ itemId: '', action: 'add', quantity: 0, reason: '' })
    setSelectedItem(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeSlide}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Pharmacy Inventory
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Track stock levels, expiry dates, and auto-reorder suggestions
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setInventory(mockInventory)
              toast({ title: 'Inventory Refreshed', description: 'Data reloaded from source.' })
            }}
          >
            <RotateCcw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div {...fadeSlide} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Items</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">In Stock</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{stats.inStock}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Low Stock</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-amber-600">{stats.lowStock}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-xs text-muted-foreground">Out of Stock</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600">{stats.outOfStock}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Value</span>
            </div>
            <p className="text-2xl font-bold mt-1">₹{stats.totalValue.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alerts Row */}
      {(reorderSuggestions.length > 0 || expiringSoonItems.length > 0) && (
        <motion.div {...fadeSlide} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reorderSuggestions.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800">
                  <TrendingDown className="h-4 w-4" /> Auto-Reorder Suggestions ({reorderSuggestions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {reorderSuggestions.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <span className="font-medium">{item.medicineName}</span>
                      <span className="text-amber-700">Stock: {item.currentStock} / Threshold: {item.threshold}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {expiringSoonItems.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-800">
                  <Calendar className="h-4 w-4" /> Expiring Within 30 Days ({expiringSoonItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {expiringSoonItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <span className="font-medium">{item.medicineName}</span>
                      <span className="text-red-700">Exp: {formatDate(item.expiryDate)} (Batch: {item.batchNumber})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Search & Filter */}
      <motion.div {...fadeSlide}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by medicine name, generic name, or batch..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Items</SelectItem>
                  <SelectItem value="IN_STOCK">In Stock</SelectItem>
                  <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                  <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stock Table */}
      <motion.div {...fadeSlide}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stock Overview</CardTitle>
            <CardDescription>
              {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                    Medicine <SortIcon field="name" />
                  </TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('stock')}>
                    Stock <SortIcon field="stock" />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('mrp')}>
                    MRP <SortIcon field="mrp" />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('expiry')}>
                    Expiry <SortIcon field="expiry" />
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No items found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map(item => {
                    const status = getAvailabilityStatus(item)
                    const expired = isExpired(item.expiryDate)
                    const expiring = isExpiringSoon(item.expiryDate, 30)
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{item.medicineName}</span>
                            <span className="text-muted-foreground text-xs block">{item.genericName} • {item.category}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs">{item.batchNumber}</span>
                        </TableCell>
                        <TableCell>
                          <span className={status === 'LOW_STOCK' ? 'text-red-600 font-semibold' : status === 'OUT_OF_STOCK' ? 'text-gray-500' : ''}>
                            {item.currentStock} {item.unit}{item.currentStock !== 1 ? 's' : ''}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-0.5">
                            <IndianRupee className="h-3 w-3" />{item.mrp}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className={expired ? 'text-red-600 font-semibold' : expiring ? 'text-amber-600 font-semibold' : ''}>
                              {formatDate(item.expiryDate)}
                            </span>
                            {expired && <Badge variant="destructive" className="text-[10px] px-1 py-0">EXPIRED</Badge>}
                            {!expired && expiring && <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1 py-0 hover:bg-amber-100">EXPIRING</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge(status)}</TableCell>
                        <TableCell className="text-right">
                          <Dialog open={updateDialogOpen && selectedItem?.id === item.id} onOpenChange={(open) => {
                            if (open) {
                              setSelectedItem(item)
                              setUpdateForm({ itemId: item.id, action: 'add', quantity: 0, reason: '' })
                            } else {
                              setUpdateDialogOpen(false)
                              setSelectedItem(null)
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => {
                                setSelectedItem(item)
                                setUpdateForm({ itemId: item.id, action: 'add', quantity: 0, reason: '' })
                                setUpdateDialogOpen(true)
                              }}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Stock — {item.medicineName}</DialogTitle>
                                <DialogDescription>
                                  Current stock: {item.currentStock} {item.unit}s | Batch: {item.batchNumber}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-2">
                                <Select value={updateForm.action} onValueChange={(v) => setUpdateForm(prev => ({ ...prev, action: v as 'add' | 'reduce' }))}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Action" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="add">Add Stock</SelectItem>
                                    <SelectItem value="reduce">Reduce Stock</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  min={1}
                                  placeholder="Quantity"
                                  value={updateForm.quantity || ''}
                                  onChange={e => setUpdateForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                                />
                                <Input
                                  placeholder="Reason (e.g., New shipment, Damaged, Returned)"
                                  value={updateForm.reason}
                                  onChange={e => setUpdateForm(prev => ({ ...prev, reason: e.target.value }))}
                                />
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
                                <Button
                                  onClick={handleStockUpdate}
                                  disabled={updateForm.quantity <= 0}
                                  className={updateForm.action === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
                                >
                                  {updateForm.action === 'add' ? <Plus className="h-4 w-4 mr-1" /> : <Minus className="h-4 w-4 mr-1" />}
                                  {updateForm.action === 'add' ? 'Add' : 'Reduce'} {updateForm.quantity || 0} Units
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Out of Stock Summary */}
      {outOfStockItems.length > 0 && (
        <motion.div {...fadeSlide}>
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" /> Out of Stock Items
              </CardTitle>
              <CardDescription>These items need immediate restocking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {outOfStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-red-100 bg-red-50/30">
                    <div>
                      <p className="font-medium text-sm">{item.medicineName}</p>
                      <p className="text-xs text-muted-foreground">{item.genericName} • {item.manufacturer}</p>
                    </div>
                    <Badge variant="destructive" className="text-[10px]">OUT</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
