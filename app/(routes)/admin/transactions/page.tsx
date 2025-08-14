'use client'

import { useState, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search, 
  Loader2, 
  AlertCircle, 
  DollarSign, 
  Users, 
  CreditCard, 
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Calendar,
  Filter
} from 'lucide-react'

import { useTransactions } from '@/hooks/useApi'
import type { TransactionDto } from '@/lib/api/generated/model'

// Status Badge component
const StatusBadge = ({ status }: { status: string }) => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'success':
    case 'completed':
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      )
    case 'pending':
    case 'processing':
      return (
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    case 'canceled':
    case 'cancelled':
    case 'failed':
    case 'expired':
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      )
    default:
      return <Badge variant="outline">{status || 'Unknown'}</Badge>
  }
}

// Price formatting function
const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
}

// Date formatting function
const formatDate = (dateString?: string | null) => {
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

export default function TransactionsPage() {
  const { data: transactions, isLoading, error: fetchError } = useTransactions()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    
    let filtered = transactions.filter(tx =>
      tx.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.planName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.payment?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => {
        const status = tx.status?.toLowerCase()
        switch (statusFilter) {
          case 'active':
            return status === 'active' || status === 'success' || status === 'completed'
          case 'pending':
            return status === 'pending' || status === 'processing'
          case 'failed':
            return status === 'canceled' || status === 'cancelled' || status === 'failed' || status === 'expired'
          default:
            return true
        }
      })
    }

    return filtered
  }, [transactions, searchTerm, statusFilter])

  // Statistics calculations
  const stats = useMemo(() => {
    const totalRevenue = transactions?.reduce((sum, tx) => tx.price ? sum + tx.price : sum, 0) ?? 0
    const totalTransactions = transactions?.length ?? 0
    const uniqueUsers = new Set(transactions?.map(tx => tx.userEmail)).size
    const activeSubscriptions = transactions?.filter(tx => {
      const status = tx.status?.toLowerCase()
      return status === 'active' || status === 'success' || status === 'completed'
    }).length ?? 0

    return { totalRevenue, totalTransactions, uniqueUsers, activeSubscriptions }
  }, [transactions])

  const statusCounts = useMemo(() => {
    if (!transactions) return { active: 0, pending: 0, failed: 0 }
    
    return transactions.reduce((acc, tx) => {
      const status = tx.status?.toLowerCase()
      if (status === 'active' || status === 'success' || status === 'completed') {
        acc.active++
      } else if (status === 'pending' || status === 'processing') {
        acc.pending++
      } else if (status === 'canceled' || status === 'cancelled' || status === 'failed' || status === 'expired') {
        acc.failed++
      }
      return acc
    }, { active: 0, pending: 0, failed: 0 })
  }, [transactions])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Monitor payments and subscription activities</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPrice(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              All time earnings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground mt-1">Payment records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error fetching transactions: {(fetchError as Error).message}
          </AlertDescription>
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
                  placeholder="Search transactions..." 
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
                  All ({stats.totalTransactions})
                </Button>
                <Button 
                  variant={statusFilter === 'active' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active ({statusCounts.active})
                </Button>
                <Button 
                  variant={statusFilter === 'pending' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setStatusFilter('pending')}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Pending ({statusCounts.pending})
                </Button>
                <Button 
                  variant={statusFilter === 'failed' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setStatusFilter('failed')}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Failed ({statusCounts.failed})
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transactions List
          </CardTitle>
          <CardDescription>
            {filteredTransactions.length} of {stats.totalTransactions} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Plan & Billing</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx, index) => (
                  <TableRow key={tx.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={tx.userAvatarUrl ?? undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {tx.userName?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="font-medium leading-none">{tx.userName || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">{tx.userEmail}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="font-medium">
                          {tx.planName || 'N/A'}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {tx.billingCycle || 'N/A'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-green-600">
                        {formatPrice(tx.price)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tx.status || 'unknown'} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{tx.payment || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(tx.date)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32">
                    <div className="text-center space-y-4">
                      <CreditCard className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-lg font-medium">No transactions found</p>
                        <p className="text-muted-foreground">
                          {searchTerm ? 'Try adjusting your search terms' : 'No payment records available'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}