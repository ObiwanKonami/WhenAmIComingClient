"use client"

import * as React from "react"
import {
  BadgeDollarSign,
  BadgePercent,
  BadgeQuestionMark,
  BookHeart,
  Command,
  Contact,
  CreditCard,
  FolderOpen,
  GitFork,
  Globe,
  Info,
  LayoutDashboard,
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
      url: '/admin/dashboard',
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Settings",
      url: "/admin/settings/website",
      icon: Settings2,
      items: [
        {
          title: "Website Settings",
          url: "/admin/settings/website",
        },
        {
          title: "Payment Settings",
          url: "#",
        },
        {
          title: "License",
          url: "#",
        },
      ],
    },
    {
      title: "Affiliate",
      url: "/admin/referal/settings",
      icon: GitFork,
      items: [
        {
          title: "Referal Settings",
          url: "/admin/referal/settings",
        },
        {
          title: "Payout Settings",
          url: "#",
        },
        {
          title: "Completed",
          url: "#",
        },
      ],
    },
    {
      title: "Payouts",
      url: "#",
      icon: CreditCard,
      items: [
        {
          title: "Add Payout",
          url: "#",
        },
        {
          title: "Payout Settings",
          url: "#",
        },
        {
          title: "Payout Requests",
          url: "#",
        },
        {
          title: "Completed",
          url: "#",
        },
      ],
    },
    {
      title: "Plans",
      url: '/admin/plans',
      icon: BookHeart,
    },
    {
      title: "Coupons",
      url: '/admin/coupons',
      icon: BadgePercent,
    },
    {
      title: "Transactions",
      url: '/admin/transactions',
      icon: BadgeDollarSign,
    },
    {
      title: "Categories",
      url: '/admin/categories',
      icon: FolderOpen,
    },
    {
      title: "Blogs",
      url: '/admin/blogs',
      icon: Rss,
    },
    {
      title: "Users",
      url: '/admin/users',
      icon: Users,
    },
    {
      title: "Workflow",
      url: '#',
      icon: Workflow,
    },
    {
      title: "Testimoinals",
      url: '/admin/testimoinals',
      icon: MessageSquareMore,
    },
    {
      title: "Features",
      url: '/admin/features',
      icon: Star,
    },
    {
      title: "Brands",
      url: '/admin/brands',
      icon: Trello,
    },
    {
      title: "Pages",
      url: '/admin/pages',
      icon: PanelsTopLeft,
    },
    {
      title: "FAQs",
      url: '/admin/faqs',
      icon: BadgeQuestionMark,
    },
    {
      title: "Contacts",
      url: '#',
      icon: Contact,
    },
    {
      title: "Info",
      url: '/admin/info',
      icon: Info,
    }
  ]

export function AppAdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
