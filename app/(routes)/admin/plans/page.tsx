'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { 
  Loader2, 
  Info, 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Check, 
  Infinity,
  CreditCard,
  CheckCircle2,
  XCircle,
  Zap,
  Star,
  Search,
  AlertCircle
} from 'lucide-react'

import { usePlans, usePlanOperations, useFeatures, usePlanForUpdate } from '@/hooks/useApi'
import { planFormSchema, type PlanFormValues } from '@/lib/schemas'
import type { PlanDto, CreatePlanCommand, UpdatePlanCommand, FeatureDto, FeatureForUpdateDto, PlanFeatureDto } from '@/lib/api/generated/model'

// Plan kartını render eden alt bileşen
const PlanCard = ({ plan, onOpenDialog, onOpenDeleteDialog, onToggleStatus, isUpdating }: {
    plan: PlanDto,
    onOpenDialog: (plan: PlanDto) => void,
    onOpenDeleteDialog: (plan: PlanDto) => void,
    onToggleStatus: (plan: PlanDto) => void,
    isUpdating: boolean
}) => {
    const formatFeature = (feature: PlanFeatureDto) => {
        if (feature.featureType === 'Limit') {
            const limit = feature.limitValue;
            if (limit === -1) return <><Infinity className="h-4 w-4 mr-2 text-primary" /> {feature.featureName}</>;
            return `${limit} ${feature.featureName}`;
        }
        return feature.featureName;
    };

    const formatPrice = (price: number | null | undefined) => {
        if (price === null || price === undefined) return '0';
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(price);
    };

    return (
        <Card className={`relative transition-all duration-200 hover:shadow-lg ${
            !plan.isActive 
                ? 'bg-muted/30 border-dashed opacity-75' 
                : 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-primary/20'
        }`}>
            {plan.isActive && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1 shadow-sm">
                        <Star className="h-3 w-3 mr-1" />
                        Active Plan
                    </Badge>
                </div>
            )}
            
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            <CardTitle className="text-xl">{plan.name}</CardTitle>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                                <span className="text-muted-foreground">Monthly:</span>
                                <span className="font-semibold text-primary">{formatPrice(plan.monthlyPrice)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                                <span className="text-muted-foreground">Yearly:</span>
                                <span className="font-semibold text-primary">{formatPrice(plan.yearlyPrice)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                                <span className="text-muted-foreground">Lifetime:</span>
                                <span className="font-semibold text-primary">{formatPrice(plan.lifetimePrice)}</span>
                            </div>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onOpenDialog(plan)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Plan
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => onOpenDeleteDialog(plan)} 
                                className="text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <Switch 
                            id={`status-${plan.id}`} 
                            checked={!!plan.isActive} 
                            onCheckedChange={() => onToggleStatus(plan)} 
                            disabled={isUpdating} 
                        />
                        <label htmlFor={`status-${plan.id}`} className="text-sm font-medium cursor-pointer">
                            {plan.isActive ? 'Visible to customers' : 'Hidden from customers'}
                        </label>
                    </div>
                    <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                        {plan.isActive ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</>
                        ) : (
                            <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                        )}
                    </Badge>
                </div>
                
                <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Features Included
                    </h4>
                    <div className="space-y-2">
                        {plan.planFeatures && plan.planFeatures.length > 0 ? (
                            plan.planFeatures.map(pf => (
                                <div key={pf.featureId} className="flex items-center text-sm bg-green-50 dark:bg-green-950/20 p-2 rounded-md">
                                    <Check className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                                    <span className="text-green-700 dark:text-green-400">
                                        {formatFeature(pf)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center text-sm text-muted-foreground italic p-2 bg-muted/30 rounded-md">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                No features selected
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// Ana Sayfa Bileşeni
export default function PlansPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<PlanDto | null>(null)
    const isEditMode = !!selectedPlan

    const { data: plans, isLoading: isLoadingPlans, error: fetchError } = usePlans()
    const { createItem: createPlan, isCreating, updateItem: updatePlan, isUpdating, deleteItem: deletePlan, isDeleting } = usePlanOperations()
    
    const { data: allFeatures, isLoading: isLoadingFeatures } = useFeatures({ query: { enabled: isDialogOpen && !isEditMode }})
    const { data: planForUpdate, isLoading: isLoadingPlanForUpdate } = usePlanForUpdate(selectedPlan?.id!, { query: { enabled: isDialogOpen && isEditMode && !!selectedPlan?.id }})

    const form = useForm<PlanFormValues>({
        resolver: zodResolver(planFormSchema),
        defaultValues: { name: '', monthlyPrice: '', yearlyPrice: '', lifetimePrice: '', features: [] },
    })
    const { fields } = useFieldArray({ control: form.control, name: "features" })

    // Filter plans
    const filteredPlans = plans?.filter(plan => {
        const matchesSearch = plan.name?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'active' && plan.isActive) ||
                            (statusFilter === 'inactive' && !plan.isActive)
        return matchesSearch && matchesStatus
    }) || []

    const activeCount = plans?.filter(p => p.isActive).length ?? 0
    const inactiveCount = plans?.filter(p => !p.isActive).length ?? 0

    useEffect(() => {
        if (!isDialogOpen) return
        
        if (isEditMode) {
            if (planForUpdate) {
                form.reset({
                    name: planForUpdate.name ?? '',
                    monthlyPrice: String(planForUpdate.monthlyPrice ?? ''), 
                    yearlyPrice: String(planForUpdate.yearlyPrice ?? ''), 
                    lifetimePrice: String(planForUpdate.lifetimePrice ?? ''),
                    features: planForUpdate.features?.map(f => ({
                        featureKey: f.key ?? '', 
                        isAssigned: f.isAssigned ?? false, 
                        value: f.value ?? ''
                    })) ?? [],
                })
            }
        } else {
            if (allFeatures) {
                form.reset({
                    name: '', monthlyPrice: '', yearlyPrice: '', lifetimePrice: '',
                    features: allFeatures.map(f => ({
                        featureKey: f.key ?? '', 
                        isAssigned: false, 
                        value: ''
                    })) ?? [],
                })
            }
        }
    }, [isDialogOpen, isEditMode, allFeatures, planForUpdate, form])

    const handleOpenDialog = (plan?: PlanDto) => {
        setSelectedPlan(plan ?? null)
        setIsDialogOpen(true)
    }

    const handleOpenDeleteDialog = (plan: PlanDto) => {
        setSelectedPlan(plan)
        setIsDeleteDialogOpen(true)
    }

    const onSubmit: SubmitHandler<PlanFormValues> = async (data) => {
        const promise = isEditMode
            ? (() => {
                if (!selectedPlan?.id) throw new Error("Plan ID is missing for update.")
                const command: UpdatePlanCommand = {
                    name: data.name, 
                    monthlyPrice: Number(data.monthlyPrice), 
                    yearlyPrice: Number(data.yearlyPrice), 
                    lifetimePrice: Number(data.lifetimePrice),
                    isActive: planForUpdate?.isActive ?? true,
                    features: data.features.filter(f => f.isAssigned).map(f => ({ 
                        featureKey: f.featureKey, 
                        value: f.value ?? "true" 
                    }))
                }
                return updatePlan({ planId: selectedPlan.id, data: command })
            })()
            : (() => {
                const command: CreatePlanCommand = {
                    name: data.name, 
                    description: null, 
                    monthlyPrice: Number(data.monthlyPrice), 
                    yearlyPrice: Number(data.yearlyPrice), 
                    lifetimePrice: Number(data.lifetimePrice), 
                    isActive: true,
                    featureValues: data.features.filter(f => f.isAssigned).map(f => ({ 
                        featureKey: f.featureKey, 
                        value: f.value ?? "true" 
                    }))
                }
                return createPlan({ data: command })
            })()

        toast.promise(promise, {
            loading: isEditMode ? 'Updating plan...' : 'Creating plan...',
            success: () => { 
                setIsDialogOpen(false)
                return `Plan has been ${isEditMode ? 'updated' : 'created'} successfully.`
            },
            error: (err) => (err as Error).message,
        })
    }

    const handleDelete = async () => {
        if (!selectedPlan?.id) return
        toast.promise(deletePlan({ planId: selectedPlan.id }), {
            loading: 'Deleting plan...',
            success: () => { 
                setIsDeleteDialogOpen(false)
                return `Plan "${selectedPlan.name}" has been deleted.`
            },
            error: (err) => (err as Error).message,
        })
    }
    
    const handleToggleStatus = (plan: PlanDto) => {
        if (!plan.id) return
        const payload: UpdatePlanCommand = {
            name: plan.name, 
            monthlyPrice: plan.monthlyPrice, 
            yearlyPrice: plan.yearlyPrice, 
            lifetimePrice: plan.lifetimePrice, 
            isActive: !plan.isActive,
            features: plan.planFeatures?.map(f => ({ 
                featureKey: f.featureKey, 
                value: f.limitValue != null ? String(f.limitValue) : "true" 
            })) ?? []
        }
        toast.promise(updatePlan({ planId: plan.id, data: payload }), {
            loading: "Updating status...", 
            success: `Status changed to ${!plan.isActive ? 'Active' : 'Inactive'}.`, 
            error: (err) => (err as Error).message
        })
    }

    const isLoadingDialog = isLoadingFeatures || isLoadingPlanForUpdate
    const isSubmitting = isCreating || isUpdating

    if (isLoadingPlans) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="text-muted-foreground">Loading pricing plans...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Pricing Plans</h1>
                    <p className="text-muted-foreground">Manage your subscription plans and pricing</p>
                </div>
                <Button onClick={() => handleOpenDialog()} size="lg" className="gap-2">
                    <Plus className="h-4 w-4" /> 
                    Create Plan
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{plans?.length ?? 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{activeCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                        <XCircle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{inactiveCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Filtered</CardTitle>
                        <Search className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filteredPlans.length}</div>
                    </CardContent>
                </Card>
            </div>

            {fetchError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{(fetchError as Error).message}</AlertDescription>
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
                                    placeholder="Search plans..." 
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
                                    All ({plans?.length ?? 0})
                                </Button>
                                <Button 
                                    variant={statusFilter === 'active' ? 'default' : 'outline'} 
                                    size="sm"
                                    onClick={() => setStatusFilter('active')}
                                >
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Active ({activeCount})
                                </Button>
                                <Button 
                                    variant={statusFilter === 'inactive' ? 'default' : 'outline'} 
                                    size="sm"
                                    onClick={() => setStatusFilter('inactive')}
                                >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inactive ({inactiveCount})
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Plans Grid */}
            {filteredPlans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlans.map(plan => (
                        <PlanCard 
                            key={plan.id} 
                            plan={plan} 
                            onOpenDialog={handleOpenDialog} 
                            onOpenDeleteDialog={handleOpenDeleteDialog} 
                            onToggleStatus={handleToggleStatus} 
                            isUpdating={isUpdating || isDeleting} 
                        />
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="text-center py-12">
                        <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No plans found</h3>
                        <p className="text-muted-foreground mb-4">
                            {searchTerm ? 'Try adjusting your search terms' : 'Create your first pricing plan to get started'}
                        </p>
                        {!searchTerm && (
                            <Button onClick={() => handleOpenDialog()}>
                                <Plus className="h-4 w-4 mr-2" /> Create First Plan
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            {isEditMode ? 'Edit Plan' : 'Create New Plan'}
                        </DialogTitle>
                    </DialogHeader>
                    
                    {isLoadingDialog ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-center space-y-4">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                                <p className="text-muted-foreground">Loading plan data...</p>
                            </div>
                        </div>
                    ) : (
                        <Form {...form}>
                            <div className="space-y-6 flex-1 overflow-hidden">
                                <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Plan Details</CardTitle>
                                            <CardDescription>Basic information about your pricing plan</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <FormField 
                                                control={form.control} 
                                                name="name" 
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Plan Name *</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="Enter plan name..." />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} 
                                            />
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <FormField 
                                                    control={form.control} 
                                                    name="monthlyPrice" 
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Monthly Price *</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" step="0.01" {...field} placeholder="0.00" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} 
                                                />
                                                <FormField 
                                                    control={form.control} 
                                                    name="yearlyPrice" 
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Yearly Price *</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" step="0.01" {...field} placeholder="0.00" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} 
                                                />
                                                <FormField 
                                                    control={form.control} 
                                                    name="lifetimePrice" 
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Lifetime Price *</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" step="0.01" {...field} placeholder="0.00" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} 
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Plan Features</CardTitle>
                                            <CardDescription>Select which features to include in this plan</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {fields.map((field, index) => {
                                                const featureData = isEditMode ? planForUpdate?.features?.[index] : allFeatures?.[index]
                                                if (!featureData) return null
                                                
                                                return (
                                                    <div key={field.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                                                        <div className="flex items-center space-x-4">
                                                            <FormField 
                                                                control={form.control} 
                                                                name={`features.${index}.isAssigned`} 
                                                                render={({ field }) => (
                                                                    <FormControl>
                                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                                    </FormControl>
                                                                )} 
                                                            />
                                                            <div>
                                                                <FormLabel className="font-medium text-base">
                                                                    {featureData.name}
                                                                </FormLabel>
                                                            </div>
                                                        </div>
                                                        
                                                        {String(featureData.type) === 'Limit' && (
                                                            <FormField 
                                                                control={form.control} 
                                                                name={`features.${index}.value`} 
                                                                render={({ field }) => (
                                                                    <FormItem className="w-48">
                                                                        <FormControl>
                                                                            <Input 
                                                                                type="number" 
                                                                                placeholder="Enter limit" 
                                                                                {...field} 
                                                                                disabled={!form.watch(`features.${index}.isAssigned`)} 
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                        <p className="text-xs text-muted-foreground pt-1 flex items-center">
                                                                            <Info className="h-3 w-3 mr-1" /> 
                                                                            Set limit. -1 for unlimited.
                                                                        </p>
                                                                    </FormItem>
                                                                )} 
                                                            />
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </CardContent>
                                    </Card>
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
                                        {isEditMode ? 'Save Changes' : 'Create Plan'}
                                    </Button>
                                </DialogFooter>
                            </div>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            Delete Plan
                        </AlertDialogTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                            Are you sure you want to delete "<strong>{selectedPlan?.name}</strong>"? 
                            This action cannot be undone and the plan will be permanently removed.
                        </p>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete} 
                            disabled={isDeleting} 
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Plan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}