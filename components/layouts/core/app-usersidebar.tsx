"use client"

import * as React from "react"
import {
  Aperture,
  BadgeDollarSign,
  BadgePercent,
  BadgeQuestionMark,
  BookHeart,
  BookImage,
  Calendar,
  Calendar1,
  ChartLine,
  CircleUserRound,
  Clock,
  Command,
  Contact,
  CreditCard,
  DollarSign,
  FolderOpen,
  GitFork,
  Globe,
  Images,
  Info,
  Laptop,
  LayoutDashboard,
  LayoutIcon,
  MapPinHouse,
  MessageSquareMore,
  PanelsTopLeft,
  Rss,
  Settings2,
  Star,
  Trello,
  Users,
  Workflow,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"

const navMenuItems = [
    {
      title: "Dashboard",
      url: '/user/dashboard',
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Subscription",
      url: '/user/subscription',
      icon: DollarSign,
      isActive: true,
    },
    {
      title: "Settings",
      url: "/user/settings/company",
      icon: Settings2,
      items: [
        {
          title: "Company Settings",
          url: "/user/settings/company",
        },
        {
          title: "General Settings",
          url: "/user/settings/company",
        },
        {
          title: "Working Hours",
          url: "/user/settings/working-hours",
        },
        {
          title: "Holidays",
          url: "/user/settings/holidays",
        },
        {
          title: "QR Code",
          url: "/user/settings/qr-code",
        },
        {
          title: "Payment Settings",
          url: "/user/settings/payment",
        },
      ],
    },
    {
      title: "Affiliate",
      url: "/user/affiliate/home",
      icon: GitFork,
      items: [
        {
          title: "Home",
          url: "/user/affiliate/home",
        },
        {
          title: "Referrals",
          url: "/user/affiliate/referrals",
        },
        {
          title: "Payouts",
          url: "/user/affiliate/payouts",
        },
      ],
    },
    {
      title: "Services",
      url: "/user/services/category",
      icon: Aperture,
      items: [
        {
          title: "Category",
          url: "/user/services/category",
        },
        {
          title: "Services",
          url: "/user/services/services",
        },
        {
          title: "Service Extra",
          url: "/user/services/service-extra",
        },
        {
          title: "Custom Inputs",
          url: "/user/services/custom-inputs",
        },
      ],
    },
    {
      title: "Appointments",
      url: '/user/appointments',
      icon: Clock,
    },
    {
      title: "Staffs",
      url: '/user/staffs',
      icon: Users,
    },
    {
      title: "Locations",
      url: '/user/locations',
      icon: MapPinHouse,
    },
    {
      title: "Customers",
      url: '/user/customers',
      icon: CircleUserRound,
    },
    {
      title: "Calendars",
      url: '/user/calendars',
      icon: Calendar1,
    },
    {
      title: "Coupons",
      url: '/user/coupons',
      icon: BadgePercent,
    },
    {
      title: "Portfolios",
      url: '/user/portfolios',
      icon: Laptop,
    },
    {
      title: "Gallery",
      url: '/user/galley',
      icon: BookImage,
    },
    {
      title: "Brands",
      url: '/user/brands',
      icon: Trello,
    },
    {
      title: "Slider",
      url: '/user/slider',
      icon: Images,
    },
    {
      title: "Testimonials",
      url: 'testimoinals',
      icon: MessageSquareMore,
    },
    {
      title: "Transactions",
      url: '/user/transactions',
      icon: BadgeDollarSign,
    },
    {
      title: "Reports",
      url: '/user/reports',
      icon: ChartLine,
    },
    {
      title: "Pages",
      url: 'pages',
      icon: PanelsTopLeft,
    }
  ]

export function AppUserSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Acme Inc</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMenuItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser/>
      </SidebarFooter>
    </Sidebar>
  )
}
