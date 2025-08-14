// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // request.cookies.get() bazen cache'lenmiş olabiliyor.
  // Cookie'nin varlığını doğrudan header'lardan kontrol etmek daha güvenilir olabilir.
  const sessionCookie = request.cookies.get('session')?.value;

  const { pathname } = request.nextUrl;

  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/dashboard');
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // Senaryo 1: Kullanıcı giriş yapmamış VE korumalı bir sayfaya gitmeye çalışıyor.
  // `sessionCookie` undefined, null veya boş string ise, kullanıcı giriş yapmamış demektir.
  if (!sessionCookie && isAdminPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Senaryo 2: Kullanıcı giriş yapmış VE login/register sayfasına gitmeye çalışıyor.
  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  
  // Diğer tüm durumlarda devam et.
  return NextResponse.next();
}

// config aynı kalabilir
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};