'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { 
  MoreHorizontal, 
  Plus, 
  Edit, 
  Trash2, 
  Percent, 
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
  Gift,
  Tag
} from 'lucide-react'

import { useCoupons, useCouponOperations } from '@/hooks/useApi'
import { useSystemSetting } from '@/hooks/useSystemSetting'
import type { CouponDto, CreateCouponCommand, UpdateCouponCommand, DiscountType } from '@/lib/api/generated/model'
import { couponFormSchema, CouponFormValues } from '@/lib/schemas'

const CURRENT_BUSINESS_ID = 1

// Disabled Panel Component
function DisabledPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">Manage discount coupons and promotional codes</p>
        </div>
      </div>
      
      <Card>
        <CardContent className="text-center py-12">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Coupon System Disabled</h3>
              <p className="text-muted-foreground mt-2">
                Enable coupon system from <strong>Settings → Website Settings → Preferences</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper functions
function toDiscountTypeName(num: DiscountType): 'Percentage' | 'FixedAmount' {
  return num === 0 ? 'Percentage' : 'FixedAmount'
}

function fromDiscountTypeName(name: 'Percentage'|'FixedAmount'): DiscountType {
  return name === 'Percentage' ? 0 as DiscountType : 1 as DiscountType
}

function formatMoney(v: number) {
  try {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY', 
      maximumFractionDigits: 2 
    }).format(v)
  } catch { 
    return `${v.toFixed(2)} ₺` 
  }
}

function formatDate(dateString?: string | null) {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return 'Invalid Date'
  }
}

export default function CouponsPage() {
  // System setting check
  const { data: setting, isLoading: isSettingsLoading, error: settingsError } =
  useSystemSetting('coupon_system')

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<CouponDto | null>(null)
  const couponEnabled = setting?.valueBool === true
  const { data, isLoading, error } = useCoupons({ enabled: couponEnabled })
  const { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting } = useCouponOperations()

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: '',
      discountType: 'Percentage',
      discountValue: '',
      startDate: '',
      endDate: '',
      usageLimit: '0',
      isActive: true
    }
  })

  const coupons: CouponDto[] = data ?? []

  // Filter coupons
  const filteredCoupons = useMemo(() => {
    let filtered = coupons.filter(c =>
      (c.code ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(c.discountValue ?? '').includes(searchTerm.toLowerCase())
    )

    if (statusFilter === 'active') {
      filtered = filtered.filter(c => c.isActive)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(c => !c.isActive)
    }

    return filtered
  }, [coupons, searchTerm, statusFilter])

  // Statistics
  const stats = useMemo(() => {
    const total = coupons.length
    const active = coupons.filter(c => c.isActive).length
    const inactive = total - active
    const totalUsage = coupons.reduce((sum, c) => sum + (c.usageCount ?? 0), 0)

    return { total, active, inactive, totalUsage }
  }, [coupons])

  if (isSettingsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (settingsError || !couponEnabled) {
    return <DisabledPanel />
  }

  const openCreate = () => {
    setSelected(null)
    form.reset({
      code: '',
      discountType: 'Percentage',
      discountValue: '',
      startDate: '',
      endDate: '',
      usageLimit: '0',
      isActive: true
    })
    setIsDialogOpen(true)
  }

  const openEdit = (coupon: CouponDto) => {
    setSelected(coupon)
    form.reset({
      code: coupon.code ?? '',
      discountType: toDiscountTypeName(coupon.discountType as DiscountType),
      discountValue: String(coupon.discountValue ?? ''),
      startDate: coupon.startDate ? coupon.startDate.substring(0,10) : '',
      endDate: coupon.endDate ? coupon.endDate.substring(0,10) : '',
      usageLimit: String(coupon.usageLimit ?? '0'),
      isActive: coupon.isActive ?? true
    })
    setIsDialogOpen(true)
  }

  const openDelete = (coupon: CouponDto) => {
    setSelected(coupon)
    setIsDeleteOpen(true)
  }

  const onSubmit = async (values: CouponFormValues) => {
    const payloadBase = {
      businessId: CURRENT_BUSINESS_ID,
      code: values.code.trim(),
      discountType: fromDiscountTypeName(values.discountType),
      discountValue: Number(values.discountValue),
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      usageLimit: Number(values.usageLimit),
      isActive: values.isActive
    }

    try {
      if (selected?.id) {
        const payload: UpdateCouponCommand = { ...payloadBase }
        await updateItem({ couponId: selected.id, data: payload })
        toast.success('Coupon updated successfully')
      } else {
        const payload: CreateCouponCommand = { ...payloadBase }
        await createItem(payload)
        toast.success('Coupon created successfully')
      }
      setIsDialogOpen(false)
    } catch (e: any) {
      toast.error(e?.message ?? 'Operation failed')
    }
  }

  const toggleActive = async (coupon: CouponDto) => {
    if (!coupon.id) return
    const dataUpd: UpdateCouponCommand = {
      businessId: coupon.businessId ?? CURRENT_BUSINESS_ID,
      code: coupon.code ?? '',
      discountType: (coupon.discountType ?? 0) as DiscountType,
      discountValue: coupon.discountValue ?? 0,
      startDate: coupon.startDate ?? new Date().toISOString(),
      endDate: coupon.endDate ?? new Date().toISOString(),
      usageLimit: coupon.usageLimit ?? 0,
      isActive: !coupon.isActive
    }
    try {
      await updateItem({ couponId: coupon.id, data: dataUpd })
      toast.success(`Coupon ${dataUpd.isActive ? 'activated' : 'deactivated'}`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to toggle status')
    }
  }

  const confirmDelete = async () => {
    if (!selected?.id) return
    try {
      await deleteItem({ couponId: selected.id })
      toast.success(`Coupon "${selected.code}" has been deleted`)
      setIsDeleteOpen(false)
    } catch (e: any) {
      toast.error(e?.message ?? 'Delete failed')
    }
  }

  const isSubmitting = isCreating || isUpdating

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading coupons...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">Manage discount coupons and promotional codes</p>
        </div>
        <Button onClick={openCreate} size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsage}</div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load coupons: {(error as Error).message}</AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search coupons..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={statusFilter === 'all' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  All ({stats.total})
                </Button>
                <Button 
                  variant={statusFilter === 'active' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active ({stats.active})
                </Button>
                <Button 
                  variant={statusFilter === 'inactive' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setStatusFilter('inactive')}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Inactive ({stats.inactive})
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Coupons List
          </CardTitle>
          <CardDescription>
            {filteredCoupons.length} of {stats.total} coupons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Coupon Details</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Valid Period</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.length > 0 ? (
                filteredCoupons.map((coupon, index) => {
                  const isPercent = (coupon.discountType as DiscountType) === 0
                  const discountText = isPercent ? `${coupon.discountValue}%` : formatMoney(coupon.discountValue ?? 0)

                  return (
                    <TableRow key={coupon.id} className={!coupon.isActive ? 'opacity-75' : ''}>
                      <TableCell className="font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Tag className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-base">{coupon.code}</h4>
                            <p className="text-sm text-muted-foreground">
                              {isPercent ? 'Percentage discount' : 'Fixed amount discount'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-green-600">
                          {discountText}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(coupon.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <span>to</span>
                            <span>{formatDate(coupon.endDate)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{coupon.usageCount ?? 0}</span>
                          <span className="text-muted-foreground">/{coupon.usageLimit ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Badge variant={coupon.isActive ? 'default' : 'secondary'} className="w-fit">
                            {coupon.isActive ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                            )}
                          </Badge>
                          <Switch
                            checked={!!coupon.isActive}
                            onCheckedChange={() => toggleActive(coupon)}
                            disabled={isUpdating}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(coupon)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Coupon
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openDelete(coupon)} 
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32">
                    <div className="text-center space-y-4">
                      <Gift className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-lg font-medium">No coupons found</p>
                        <p className="text-muted-foreground">
                          {searchTerm ? 'Try adjusting your search terms' : 'Create your first coupon to get started'}
                        </p>
                      </div>
                      {!searchTerm && (
                        <Button onClick={openCreate}>
                          <Plus className="h-4 w-4 mr-2" /> Create First Coupon
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              {selected ? 'Edit Coupon' : 'Create New Coupon'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <div className="space-y-6 flex-1 overflow-hidden">
              <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coupon Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. WELCOME10" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="discountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Type</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(v as 'Percentage'|'FixedAmount')}
                          value={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Percentage">Percentage (%)</SelectItem>
                            <SelectItem value="FixedAmount">Fixed Amount (₺)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discountValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Value</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="e.g. 10" 
                            {...field} 
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="usageLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usage Limit</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            placeholder="0 for unlimited"
                            {...field} 
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={field.value} 
                            onChange={field.onChange} 
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={field.value} 
                            onChange={field.onChange} 
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Coupon</FormLabel>
                        <FormDescription>
                          Inactive coupons cannot be used by customers
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                          disabled={isSubmitting}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="flex-shrink-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)} 
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  disabled={isSubmitting}
                  onClick={form.handleSubmit(onSubmit)}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selected ? 'Save Changes' : 'Create Coupon'}
                </Button>
              </DialogFooter>
            </div>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Coupon
            </AlertDialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete coupon "<strong>{selected?.code}</strong>"? 
              This action cannot be undone and the coupon will be permanently removed.
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting} 
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Coupon
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}