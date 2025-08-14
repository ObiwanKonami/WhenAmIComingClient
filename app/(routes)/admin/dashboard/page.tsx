'use client'

import { useMemo } from 'react'
import { useAdminReport } from '@/hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  CalendarDays, 
  ClipboardList, 
  Briefcase,
  TrendingUp,
  DollarSign,
  Activity,
  UserCheck,
  Calendar,
  Loader2,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Clock
} from 'lucide-react'
import {
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts'

const today = new Date()
const toIso = (d: Date) => d.toISOString()
const addMonths = (d: Date, m: number) => new Date(d.getFullYear(), d.getMonth() + m, d.getDate())

// Chart colors
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function SiteDashboardPage() {
  const from = toIso(addMonths(today, -12))
  const to = toIso(today)
  const { data, isLoading, error } = useAdminReport()

  const totals = data?.totals
  const latestAppts = data?.latestAppointments ?? []
  const topServices = data?.topServices ?? []

  // Calculate unique customers from recent appointments
  const customers = useMemo(() => {
    const uniqueCustomers = new Set(
      (latestAppts ?? [])
        .map((a: any) => a.customerName ?? '')
        .filter(Boolean)
    )
    return uniqueCustomers.size
  }, [latestAppts])

  // Group revenue by month for last 12 months
  const monthlyIncome = useMemo(() => {
    const monthMap = new Map<string, number>()
    
    for (const item of data?.revenueDaily ?? []) {
      const date = new Date(item.date ?? '')
      if (isNaN(date.getTime())) continue
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthMap.set(monthKey, (monthMap.get(monthKey) ?? 0) + Number(item.value ?? 0))
    }
    
    // Generate last 12 months data
    const monthlyData: { month: string; income: number; monthName: string }[] = []
    for (let i = 11; i >= 0; i--) {
      const date = addMonths(today, -i)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      
      monthlyData.push({ 
        month: monthKey, 
        income: monthMap.get(monthKey) ?? 0,
        monthName
      })
    }
    
    return monthlyData
  }, [data?.revenueDaily])

  // Service distribution for pie chart
  const servicePie = useMemo(() => {
    const total = topServices.reduce((sum: number, service: any) => sum + (service.count ?? 0), 0) || 1
    
    return topServices.slice(0, 6).map((service: any, index: number) => ({
      name: service.name ?? 'Unknown Service',
      value: service.count ?? 0,
      percentage: ((service.count ?? 0) / total) * 100,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }))
  }, [topServices])

  const netIncome = monthlyIncome.reduce((sum, month) => sum + month.income, 0)
  const avgMonthlyIncome = monthlyIncome.length > 0 ? netIncome / monthlyIncome.length : 0

  // Recent appointments for latest users table
  const recentUsers = useMemo(() => {
    const uniqueUsers = new Map()
    
    latestAppts.forEach((appointment: any) => {
      const customerName = appointment.customerName
      if (customerName && !uniqueUsers.has(customerName)) {
        uniqueUsers.set(customerName, {
          name: customerName,
          service: appointment.serviceName ?? 'Unknown Service',
          date: appointment.startDateTime,
          status: appointment.status ?? 'Unknown'
        })
      }
    })
    
    return Array.from(uniqueUsers.values()).slice(0, 8)
  }, [latestAppts])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading site overview...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Site Overview</h1>
          <p className="text-muted-foreground">Monitor your platform's overall performance and user activity</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load site data: {String((error as any)?.message ?? error)}
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Users className="h-5 w-5" />}
          title="Total Users"
          value={String(totals?.newUsers ?? 0)}
          subtitle="New registrations"
          color="blue"
        />
        <KpiCard
          icon={<Briefcase className="h-5 w-5" />}
          title="Active Services"
          value={String(topServices.length)}
          subtitle="Available services"
          color="green"
        />
        <KpiCard
          icon={<CalendarDays className="h-5 w-5" />}
          title="Total Bookings"
          value={String(totals?.appointments ?? 0)}
          subtitle="All appointments"
          color="purple"
        />
        <KpiCard
          icon={<UserCheck className="h-5 w-5" />}
          title="Unique Customers"
          value={String(customers)}
          subtitle="Active customers"
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Revenue Trend
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Last 12 months performance • Avg: {formatCurrency(avgMonthlyIncome)}
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyIncome}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="monthName" 
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                    tickFormatter={(value) => formatCurrency(value, true)}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fill="url(#incomeGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Services Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Service Distribution
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Most popular services by booking count
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {servicePie.length > 0 ? (
                <div className="flex items-center h-full">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={servicePie} 
                          dataKey="value" 
                          nameKey="name" 
                          cx="50%" 
                          cy="50%" 
                          outerRadius={80}
                          label={({ percentage }) => `${percentage.toFixed(1)}%`}
                        >
                          {servicePie.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any, name: any) => [
                            `${value} bookings`, 
                            name
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-48 pl-4">
                    <div className="space-y-2">
                      {servicePie.map((service, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: service.color }}
                          />
                          <span className="flex-1 truncate">{service.name}</span>
                          <span className="text-muted-foreground">{service.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <PieChartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No service data available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latest Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Customer Activity
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Latest customer bookings and service interactions
          </p>
        </CardHeader>
        <CardContent>
          {recentUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Service</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user: any, index: number) => (
                    <tr key={index} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{user.service}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(user.date)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={user.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No recent customer activity</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Net Income Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Annual Revenue Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Fiscal Year</p>
              <p className="text-2xl font-bold">{new Date().getFullYear()}</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(netIncome)}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Monthly Average</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(avgMonthlyIncome)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ========== Helper Components ========== */

interface KpiCardProps {
  icon: React.ReactNode
  title: string
  value: string
  subtitle: string
  color: 'blue' | 'green' | 'purple' | 'orange'
}

function KpiCard({ icon, title, value, subtitle, color }: KpiCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'confirmed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'pending':
      case 'waiting':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  return (
    <Badge className={`text-xs ${getStatusStyle(status)}`}>
      {status || 'Unknown'}
    </Badge>
  )
}

/* ========== Helper Functions ========== */

function formatCurrency(value: number, short: boolean = false): string {
  try {
    if (short && value >= 1000) {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M ₺`
      } else {
        return `${(value / 1000).toFixed(1)}K ₺`
      }
    }
    
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value)
  } catch {
    return `${value?.toFixed?.(2) ?? value} ₺`
  }
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '—'
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return '—'
  }
}