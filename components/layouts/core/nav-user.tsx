"use client"

import {
  ChevronsUpDown,
  LogOut,
  User,
} from "lucide-react"
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

// DÜZELTME 1: Doğru hook'ları, standart isimleriyle import ediyoruz.
import { useCurrentUser, useAuth } from '@/hooks/useApi'

export function NavUser() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  
  // DÜZELTME 2: `useAuthMutations` yerine standart `useAuth`'ı kullanıyoruz.
  const { data: user, isLoading } = useCurrentUser();
  const { logout, isLoggingOut } = useAuth();

  // DÜZELTME 3: `name`'in null veya undefined olma ihtimaline karşı `getInitials`'ı güncelliyoruz.
  const getInitials = (name?: string | null) => {
    return (name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  
  const handleLogout = async () => {
    toast.promise(logout(), {
        loading: 'Logging out...',
        success: () => {
            // DÜZELTME: Logout işlemi backend'de ve frontend cache'inde
            // başarıyla tamamlandığında, kullanıcıyı login sayfasına
            // MANUEL olarak yönlendiriyoruz.
            router.push('/login');
            return 'You have been logged out successfully.';
        },
        error: (err) => {
            // Hata durumunda bile yönlendirmeyi deneyebiliriz, çünkü cookie geçersiz olabilir.
            router.push('/login');
            return (err as Error).message || 'Failed to log out.';
        },
    });
  };

  // Yükleme durumu
  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled className="bg-transparent">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1 ml-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Kullanıcı bulunamadı durumu
  // AuthGuard'dan geçtiyse bu component render edilir, bu yüzden bu kontrol genellikle gereksizdir,
  // ama bir güvenlik katmanı olarak kalabilir.
  if (!user) {
    return null; 
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {/* DÜZELTME 4: `image` ve `name` için null/undefined kontrolü */}
                <AvatarImage src={user.imageUrl ?? undefined} alt={user.name ?? 'User Avatar'} />
                <AvatarFallback className="rounded-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name ?? 'User'}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email ?? 'No email'}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-2 p-1.5">
                <Avatar className="h-8 w-8 rounded-lg">
                   <AvatarImage src={user.imageUrl ?? undefined} alt={user.name ?? 'User Avatar'} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm">
                  <span className="truncate font-medium">{user.name ?? 'User'}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email ?? 'No email'}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              {/* ... Diğer menü item'ları ... */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}