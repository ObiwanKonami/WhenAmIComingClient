'use client'

import { AppAdminSidebar } from "@/components/layouts/core/app-adminsidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from 'next/navigation'

interface AdminLayoutProps {
  children: React.ReactNode
}

// Breadcrumb mapping for different admin pages
const getBreadcrumbData = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  
  const breadcrumbMap: { [key: string]: string } = {
    'admin': 'Admin Panel',
    'categories': 'Categories' ,
    'users': 'Users',
    'settings': 'Settings' ,
    'dashboard': 'Dashboard' ,
    'payouts': 'Payouts' ,
    'plans': 'Plans',
    'coupons': 'Coupons' ,
    'transactions': 'Transactions' ,
    'blogs':  'Blogs' ,
    'workflow': 'Workflow' ,
    'testimonials': 'Testimonials' ,
    'features': 'Features' ,
    'brands': 'Brands' ,
    'pages': 'Pages' ,
    'faqs': 'FAQs' ,
    'contacts': 'Contacts' ,
    'info':'Info'
  };

  if (segments.length === 0) return [];
  
  const breadcrumbs = [{
    title: breadcrumbMap[segments[0]] || 'Home',
    href: `/${segments[0]}/dashboard`
  }];

  // Eğer URL'de ikinci bir segment varsa (örn: 'users'), onu da ekle
  if (segments.length > 1 && breadcrumbMap[segments[1]]) {
    breadcrumbs.push({
      title: breadcrumbMap[segments[1]],
      href: `/${segments[0]}/${segments[1]}`
    });
  }
  
  return breadcrumbs;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbData(pathname)
  
  return (
        <SidebarProvider>
      <AppAdminSidebar />
      <SidebarInset>
      {/* Header with Breadcrumb - Her admin sayfasında görünür */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.title} className="flex items-center">
                  {index > 0 && (
                    <BreadcrumbSeparator className="hidden md:block mx-2" />
                  )}
                  <BreadcrumbItem className="hidden md:block">
                    {index === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href || '#'}>
                          {crumb.title}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Main Content Area - Her sayfa burada render edilir */}
      <main className="flex flex-1 flex-col gap-4 p-16">
        {children}
      </main>
    </SidebarInset>
        </SidebarProvider>

  
  )
}