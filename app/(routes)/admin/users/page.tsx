'use client'

import { useState, useMemo } from 'react'
import React from 'react'
import { toast } from 'sonner'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Search, 
  Loader2, 
  AlertCircle, 
  ExternalLink, 
  Calendar,
  Phone, 
  Mail, 
  User as UserIcon, 
  Users, 
  CreditCard, 
  Crown, 
  LayoutGrid, 
  List, 
  Copy, 
  Clock, 
  Star,
  Zap,
  CheckCircle2,
  XCircle,
  Gem
} from 'lucide-react'

import {
  useUsers,
  useUserOperations,
  usePlans,
  useSubscriptions,
  useBusiness,
  useRoles,
  useRoleAssignments,
  useUserAdminUpdate
} from '@/hooks/useApi'

import type {
  UserDto,
  SubscriptionDto,
  CreateUserCommand,
  PlanDto,
  UpdateUserAndSubscriptionCommand,
  PaymentStatus
} from '@/lib/api/generated/model'
import { type UserFormValues } from '@/lib/schemas'
import { UserForm } from './user-form'

interface Role { id: number | string; name: string }

interface DisplayUser extends UserDto {
  businessSlug?: string | null
  planName: string
  paymentStatus: 'Paid' | 'Pending' | 'Cancelled' | 'Refunded' | 'Failed' | 'Free' | 'Inactive'
  joinDate: string
  subscription?: SubscriptionDto
  roles?: string[]
}

const subscriptionStatusToPaymentStatus = (status?: string): string | undefined => {
    if (!status) return undefined;
    switch (status) {
        case 'Active': return 'Success';
        case 'PendingPayment': return 'Pending';
        case 'Cancelled':
        case 'Expired':
        case 'Unpaid':
        case 'PastDue': return 'Cancelled';
        default: return undefined;
    }
};

export default function UsersPage() {
  // API hooks
  const { data: users, isLoading: isLoadingUsers, error: usersError } = useUsers()
  const { data: plans, isLoading: isLoadingPlans, error: plansError } = usePlans()
  const { data: subscriptions, isLoading: isLoadingSubscriptions, error: subscriptionsError } = useSubscriptions()
  const { data: businesses, isLoading: isLoadingBusinesses, error: businessesError } = useBusiness()

  // Roles
  const { data: rolesData, isLoading: isLoadingRoles, error: rolesError } = useRoles()
  const { assignUserToRole, removeUserFromRole } = useRoleAssignments()

  const { createItem, isCreating, deleteItem, isDeleting } = useUserOperations()
  const { adminUpdate, isSaving: isUpdating } = useUserAdminUpdate()

  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<DisplayUser | null>(null)
  const [copied, setCopied] = useState('')

  const isSubmitting = isCreating || isUpdating
  const isLoading = isLoadingUsers || isLoadingPlans || isLoadingSubscriptions || isLoadingBusinesses || isLoadingRoles
  const fetchError = usersError || plansError || subscriptionsError || businessesError || rolesError

  const availableRoles: Role[] = useMemo(() => (rolesData ?? []).map((r: any) => ({ id: r.id, name: r.name })), [rolesData])

  const displayUsers: DisplayUser[] = useMemo(() => {
    if (!users || !plans || !subscriptions || !businesses) return []

    const plansMap = new Map(plans.map(p => [p.id, p]))
    const subscriptionsMap = new Map(subscriptions.map(s => [s.userId, s]))
    const businessMap = new Map(businesses.map(b => [b.userId, b]))

    return users.map((user): DisplayUser => {
      const subscription = subscriptionsMap.get(user.id)
      const plan = subscription ? plansMap.get(subscription.planId) : undefined
      const business = businessMap.get(user.id)

      let paymentStatus: DisplayUser['paymentStatus'] = 'Free'
      if (subscription) {
        switch (subscription.status as string) {
          case 'Active': paymentStatus = 'Paid'; break
          case 'PendingPayment': paymentStatus = 'Pending'; break
          case 'Cancelled':
          case 'Expired':
          case 'Unpaid':
          case 'PastDue': paymentStatus = 'Cancelled'; break
          default: paymentStatus = 'Inactive'
        }
      }

      return {
        ...user,
        roles: user.roles ?? undefined,
        businessSlug: business?.slug ?? undefined,
        planName: plan?.name ?? 'Free',
        paymentStatus,
        joinDate: new Date(user.createdAt ?? Date.now()).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        subscription,
      }
    })
  }, [users, plans, subscriptions, businesses])

  const filteredUsers = useMemo(() => {
    return displayUsers.filter(user => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        (user.name ?? '').toLowerCase().includes(searchLower) ||
        (user.email ?? '').toLowerCase().includes(searchLower) ||
        (user.phone ?? '').toLowerCase().includes(searchLower)

      const statusString = user.status ? 'Active' : 'Inactive'
      const matchesStatus = statusFilter === 'all' || statusString === statusFilter
      const matchesPlan = planFilter === 'all' || user.planName === planFilter
      return matchesSearch && matchesStatus && matchesPlan
    })
  }, [displayUsers, searchTerm, statusFilter, planFilter])
  
  const formInitialData = useMemo(() => {
    if (!selectedUser) {
        return undefined;
    }

    const currentSubscription = subscriptions?.find(s => s.userId === selectedUser.id);
    const currentPlan = currentSubscription ? plans?.find(p => p.id === currentSubscription.planId) : undefined;

    return {
        name: selectedUser.name || '',
        slug: selectedUser.businessSlug || '',
        email: selectedUser.email || '',
        phone: selectedUser.phone || '',
        password: '',
        status: !!selectedUser.status,
        roles: (selectedUser.roles ?? []) as string[],
        plan: currentPlan?.name ?? 'Free',
        subscriptionType: (currentSubscription as any)?.billingCycle ?? 'Monthly',
        paymentStatus: subscriptionStatusToPaymentStatus((currentSubscription as any)?.status),
    };
  }, [selectedUser, subscriptions, plans]);

  // Statistics
  const stats = useMemo(() => {
    const total = displayUsers.length
    const active = displayUsers.filter(u => u.status).length
    const paidSubscriptions = displayUsers.filter(u => u.paymentStatus === 'Paid').length
    const premiumUsers = displayUsers.filter(u => u.planName !== 'Free').length
    const freeUsers = displayUsers.filter(u => u.planName === 'Free').length
    const premiumCount = displayUsers.filter(u => u.planName === 'Premium').length
    const platinumCount = displayUsers.filter(u => u.planName === 'Platinum').length

    return { 
      total, 
      active, 
      paidSubscriptions, 
      premiumUsers, 
      freeUsers,
      premiumCount,
      platinumCount
    }
  }, [displayUsers])

  // Helper Functions
  const getInitials = (name?: string | null) => (name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  
  const getStatusColor = (status?: boolean) => 
    status 
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200'
  
  const getPaymentColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'Paid': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200'
      case 'Pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200'
      case 'Failed':
      case 'Cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200'
    }
  }
  
  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'platinum': return 'bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 dark:from-indigo-900/30 dark:to-blue-900/30 dark:text-indigo-300 border-indigo-200'
      case 'premium': return 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-400 border-purple-200'
      case 'pro': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200'
      case 'basic': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200'
    }
  }
  
  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'platinum': return Gem   // En yüksek seviye
      case 'premium': return Crown  // Orta seviye
      case 'pro': return Star
      case 'basic': return Zap
      default: return UserIcon
    }
  }
  
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      toast.success(`${type} copied to clipboard!`)
      setTimeout(() => setCopied(''), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  async function syncUserRoles(userId: number, nextRoles: string[], prevRoles: string[]) {
    const toAdd = nextRoles.filter(r => !prevRoles.includes(r))
    const toRemove = prevRoles.filter(r => !nextRoles.includes(r))

    for (const roleName of toAdd) {
      const role = availableRoles.find(r => r.name === roleName)
      if (role) await assignUserToRole({ data: { userId, roleId: Number(role.id) } })
    }
    for (const roleName of toRemove) {
      const role = availableRoles.find(r => r.name === roleName)
      if (role) await removeUserFromRole({ data: { userId, roleId: Number(role.id) } })
    }
  }

  // Events
  const handleOpenDialog = (user?: DisplayUser) => {
    setSelectedUser(user || null)
    setIsDialogOpen(true)
  }

  const handleOpenDeleteDialog = (user: DisplayUser) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const onSubmit = async (data: UserFormValues) => {
    const promise = selectedUser
      ? (async () => {
        if (!selectedUser?.id) throw new Error('User ID is missing.');

        const selectedPlan = plans?.find(p => p.name === data.plan);
        const planId = selectedPlan ? selectedPlan.id : 0;

        const payload: UpdateUserAndSubscriptionCommand = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          status: data.status,
          roles: data.roles,
          planId: planId,
          billingCycle: data.subscriptionType,
          paymentStatus: data.paymentStatus as PaymentStatus | undefined
        };

        if (data.password) {
          (payload as any).password = data.password;
        }

        await adminUpdate({ id: selectedUser.id, data: payload });

        const prevRoles = (selectedUser.roles ?? []) as string[];
        await syncUserRoles(Number(selectedUser.id), data.roles ?? [], prevRoles);

        return { id: selectedUser.id };
      })()
      : (async () => {
        const payload: CreateUserCommand = { ...data, ...(data.password === '' && { password: undefined }) } as any;
        const res: any = await createItem({ data: payload });
        const newId = Number(res?.id ?? res);
        if (!Number.isFinite(newId)) throw new Error('Invalid create user response');
        await syncUserRoles(newId, data.roles ?? [], []);
        return { id: newId };
      })();

    toast.promise(promise, {
      loading: selectedUser ? 'Updating user and subscription...' : 'Creating user...',
      success: () => { 
        setIsDialogOpen(false); 
        return `User has been ${selectedUser ? 'updated' : 'created'} successfully.`
      },
      error: (err) => (err as Error).message,
    });
  }

  const handleDelete = async () => {
    if (!selectedUser || typeof selectedUser.id === 'undefined') return
    toast.promise(deleteItem({ id: selectedUser.id }), {
      loading: 'Deleting user...',
      success: () => { 
        setIsDeleteDialogOpen(false); 
        return `User "${selectedUser.name}" has been deleted.`
      },
      error: (err) => (err as Error).message,
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user accounts, subscriptions and business profiles</p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <CheckCircle2 className="h-3 w-3 inline mr-1" />
              {stats.active} active users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Plans</CardTitle>
            <Gem className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{stats.premiumUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Paid subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Distribution</CardTitle>
            <Crown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Free:</span>
                <span className="font-medium">{stats.freeUsers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-purple-600">Premium:</span>
                <span className="font-medium text-purple-600">{stats.premiumCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-600">Platinum:</span>
                <span className="font-medium text-indigo-600">{stats.platinumCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered Results</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredUsers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Current view</p>
          </CardContent>
        </Card>
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{(fetchError as Error).message}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="Free">Free</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Platinum">Platinum</SelectItem>
                  {plans?.filter(plan => 
                    !['Free', 'Premium', 'Platinum'].includes(plan.name || '')
                  ).map(plan => (
                    <SelectItem key={plan.id} value={plan.name ?? ''}>{plan.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('table')}>
                <List className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {viewMode === 'table' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users List
            </CardTitle>
            <CardDescription>
              {filteredUsers.length} of {stats.total} users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>User Details</TableHead>
                  <TableHead>Plan & Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Information</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? filteredUsers.map((user, index) => {
                  const PlanIcon = getPlanIcon(user.planName)
                  return (
                    <TableRow key={user.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.imageUrl ?? undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <div className="font-semibold">{user.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span>{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                            {user.businessSlug && (
                              <button 
                                onClick={() => window.open(`/${user.businessSlug}`, '_blank')} 
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>View Booking Page</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <PlanIcon className="h-4 w-4" />
                            <Badge className={getPlanColor(user.planName)}>
                              {user.planName}
                            </Badge>
                          </div>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                            )}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentColor(user.paymentStatus)}>
                          {user.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Joined {user.joinDate}</span>
                          </div>
                          {user.subscription?.endDate && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>Expires {new Date(user.subscription.endDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}</span>
                            </div>
                          )}
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
                            {user.businessSlug && (
                              <DropdownMenuItem onClick={() => window.open(`/${user.businessSlug}`, '_blank')}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Booking Page
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => copyToClipboard(user.email || '', 'Email')}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenDialog(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleOpenDeleteDialog(user)} 
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                }) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32">
                      <div className="text-center space-y-4">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div>
                          <p className="text-lg font-medium">No users found</p>
                          <p className="text-muted-foreground">
                            {searchTerm ? 'Try adjusting your search terms' : 'Create your first user to get started'}
                          </p>
                        </div>
                        {!searchTerm && (
                          <Button onClick={() => handleOpenDialog()}>
                            <Plus className="h-4 w-4 mr-2" /> Create First User
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
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const PlanIcon = getPlanIcon(user.planName)
            return (
              <Card key={user.id} className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={user.imageUrl ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(user.status)}>
                        {user.status ? 'Active' : 'Inactive'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(user)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleOpenDeleteDialog(user)} 
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{user.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PlanIcon className="h-4 w-4" />
                      <Badge className={getPlanColor(user.planName)}>{user.planName}</Badge>
                    </div>
                    <Badge className={getPaymentColor(user.paymentStatus)}>{user.paymentStatus}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Joined {user.joinDate}</span>
                    </div>
                    {user.subscription?.endDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Expires {new Date(user.subscription.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}</span>
                      </div>
                    )}
                    {user.businessSlug && (
                      <button 
                        onClick={() => window.open(`/${user.businessSlug}`, '_blank')} 
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <span>View Booking Page</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {filteredUsers.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No users found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Try adjusting your search terms' : 'Create your first user to get started'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" /> Create First User
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedUser ? 'Edit User' : 'Create New User'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser ? 'Update user profile and subscription details' : 'Add a new user to the system with their profile information'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <UserForm
              isSubmitting={isSubmitting}
              onSubmit={onSubmit}
              availableRoles={availableRoles}
              availablePlans={plans ?? []}
              initialData={formInitialData}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete User
            </AlertDialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete "<strong>{selectedUser?.name}</strong>"?
              This action cannot be undone and will permanently remove the user and all associated data.
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
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}