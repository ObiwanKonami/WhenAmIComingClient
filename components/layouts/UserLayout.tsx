'use client'

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
import { AppUserSidebar } from "./core/app-usersidebar"

// YENİ: Gerekli hook ve component'leri import ediyoruz
import { useBusiness } from '@/hooks/useApi'; 
import { OnboardingSteps } from "./OnboardingSteps"

interface UserLayoutProps {
  children: React.ReactNode
}

// Breadcrumb mapping for different user pages
const getBreadcrumbData = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  
  const breadcrumbMap: { [key: string]: string } = {
    'user': 'User Panel', 'settings': 'Settings', 'dashboard': 'Dashboard', 'subscription': 'Subscription', 'affiliate': 'Affiliate', 'services': 'Services', 'appointments': 'Appointments', 'staffs': 'Staffs', 'locations': 'Locations', 'customers': 'Customers', 'calendars': 'Calendars', 'coupons': 'Coupons', 'portfolios': 'Portfolios', 'gallery': 'Gallery', 'brands': 'Brands', 'slider': 'Slider', 'testimonials': 'Testimonials', 'transactions': 'Transactions', 'reports': 'Reports', 'pages': 'Pages'
  };

  if (segments.length === 0) return [];
  
  const breadcrumbs = [{
    title: breadcrumbMap[segments[0]] || 'Home',
    href: `/${segments[0]}/dashboard`
  }];

  if (segments.length > 1 && breadcrumbMap[segments[1]]) {
    breadcrumbs.push({
      title: breadcrumbMap[segments[1]],
      href: `/${segments[0]}/${segments[1]}`
    });
  }
  
  return breadcrumbs;
}

// DÜZELTME: Fonksiyon adı `UserLayout` olarak düzeltildi.
export default function UserLayout({ children }: UserLayoutProps) {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbData(pathname)
  
  // YENİ: Onboarding durumu için işletme verisini çekiyoruz.
  const { data: businessData, isLoading } = useBusiness();
  const myBusiness = Array.isArray(businessData) ? businessData[0] : businessData;

  return (
    <SidebarProvider>
      <AppUserSidebar />
      <SidebarInset>
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
                    {index > 0 && <BreadcrumbSeparator className="hidden md:block mx-2" />}
                    <BreadcrumbItem className="hidden md:block">
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={crumb.href || '#'}>{crumb.title}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <main className="flex flex-1 flex-col gap-4 p-16 relative">
          {children}

          {/* YENİ: OnboardingSteps component'i burada render ediliyor. */}
          {!isLoading && myBusiness && (
            <OnboardingSteps
              status={{
                hasSetWorkingHours: myBusiness.hasSetWorkingHours ?? false,
                hasAddedStaff: myBusiness.hasAddedStaff ?? false,
                hasAddedCustomer: myBusiness.hasAddedCustomer ?? false,
                hasAddedService: myBusiness.hasAddedService ?? false,
              }}
            />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}