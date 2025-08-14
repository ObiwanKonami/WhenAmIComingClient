'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useCurrentUser } from '@/hooks/useApi'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { data: user, isLoading, isError } = useCurrentUser();

  useEffect(() => {
    // Veri yükleniyorsa, henüz bir şey yapma
    if (isLoading) {
      return;
    }
    
    // Yükleme bittiğinde, kullanıcı yoksa veya bir hata varsa (örn: 401 Unauthorized),
    // login sayfasına yönlendir.
    if (!user || isError) {
      router.push('/login');
    }
  }, [user, isLoading, isError, router]);

  // Oturum durumu kontrol edilirken bir yükleme ekranı göster
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Eğer kullanıcı varsa (yani oturum geçerliyse), sarmalanan sayfayı göster
  if (user) {
    return <>{children}</>;
  }

  // Kullanıcı yoksa ve yönlendirme gerçekleşiyorsa, hiçbir şey gösterme
  // Bu, login sayfasının anlık olarak görünmesini engeller.
  return null;
}