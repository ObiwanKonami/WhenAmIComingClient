'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Users, ListChecks, Calendar, UserCheck, TrendingUp, Info } from 'lucide-react'

// Sample data - gerçek API'dan gelecek
const statsData = [
  {
    title: "Users",
    value: "1",
    icon: Users,
    bgColor: "bg-blue-500",
    cardBg: "bg-blue-50"
  },
  {
    title: "Services", 
    value: "5",
    icon: ListChecks,
    bgColor: "bg-green-500",
    cardBg: "bg-green-50"
  },
  {
    title: "Appointments",
    value: "0", 
    icon: Calendar,
    bgColor: "bg-red-500",
    cardBg: "bg-red-50"
  },
  {
    title: "Customers",
    value: "1",
    icon: UserCheck,
    bgColor: "bg-teal-500", 
    cardBg: "bg-teal-50"
  }
]

// Income data for bar chart
const incomeData = [
  { month: 'Sep 24', income: 0 },
  { month: 'Oct 24', income: 0 },
  { month: 'Nov 24', income: 0 },
  { month: 'Dec 24', income: 0 },
  { month: 'Jan 25', income: 0 },
  { month: 'Feb 25', income: 0 },
  { month: 'Mar 25', income: 0 },
  { month: 'Apr 25', income: 0 },
  { month: 'May 25', income: 25 },
  { month: 'Jun 25', income: 0 },
  { month: 'Jul 25', income: 0 },
  { month: 'Aug 25', income: 0 }
]

// Pie chart data
const packageData = [
  { name: 'Premium', value: 50, color: '#3b82f6' },
  { name: 'Standard', value: 50, color: '#6366f1' }
]

// Latest users data
const latestUsers = [
  {
    id: 1,
    name: "Masculine Hair Boss",
    avatar: "M",
    plan: "Premium",
    planColor: "bg-blue-500",
    joiningDate: "3 months ago"
  }
]

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <Card key={index} className={`${stat.cardBg} border-0`}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`${stat.bgColor} p-3 rounded-full`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Income Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Last 12 months Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Bar dataKey="income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Income</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Packages Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Packages by User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={packageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {packageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-6 mt-4">
              {packageData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {item.name}: {item.value}.0 %
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Latest Users */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Joining date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                            {user.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${user.planColor} text-white hover:${user.planColor}`}>
                        {user.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span>{user.joiningDate}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Net Income */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Net Income</span>
              <Info className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fiscal year</span>
                <span className="font-semibold">2025</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Income</span>
                <span className="font-semibold text-green-600">25.00</span>
              </div>
            </div>
            
            {/* Visual indicator */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  Positive income trend
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Your business is performing well this fiscal year
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}