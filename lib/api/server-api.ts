// lib/api/server-api.ts (STANDARTLAŞTIRILMIŞ VE EKSİKSİZ NİHAİ SÜRÜM)

import { cookies } from 'next/headers';

// =================================================================
// GEREKLİ TÜM DTO TİPLERİNİ TEK BİR YERDEN IMPORT EDELİM
// =================================================================
import type {
  PageDto,
  BusinessDto,
  CompanyPublicProfileDto,
} from './generated/model';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5014';

// =================================================================
// TEMEL FETCH FONKSİYONU
// =================================================================

/**
 * Sunucu tarafında, kimlik doğrulama cookie'lerini otomatik ekleyerek
 * API'ye güvenli fetch istekleri yapar.
 */
async function serverFetch(endpoint: string, options: RequestInit = {}, isProtected: boolean = false): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers);

  // Sadece korumalı (protected) endpoint'ler için cookie'leri ekle
  if (isProtected) {
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('session');
      if (sessionCookie) {
        headers.set('Cookie', `${sessionCookie.name}=${sessionCookie.value}`);
      }
    } catch (error) {
      // `cookies()` bir istek kapsamı dışında çağrılırsa hata verir. 
      // Bu durumu yakalayıp loglayabiliriz ama isteğe devam etmesini engellememeliyiz
      // çünkü public endpoint'ler cookie'siz de çalışabilir.
      console.warn("Could not access cookies. This is normal during build time (generateStaticParams).");
    }
  }

  return fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  });
}

/**
 * serverFetch'i sarmalayan ve JSON'a çevirip tip güvenliği sağlayan generic bir GET fonksiyonu.
 */
async function get<T>(endpoint: string, isProtected: boolean = false): Promise<T | null> {
  try {
    const response = await serverFetch(endpoint, { method: 'GET' });
    if (!response.ok) {
      // 404 gibi beklenen hataları sessizce null olarak döndür
      if (response.status === 404) return null;
      // Diğer hataları logla
      console.error(`Server API Error (GET ${endpoint}): ${response.status} ${response.statusText}`);
      return null;
    }
    return await response.json() as T;
  } catch (error) {
    console.error(`Server API Fetch Error (GET ${endpoint}):`, (error as Error).message);
    return null;
  }
}

// =================================================================
// EXPORT EDİLEN SERVER API İSTEMCİSİ
// =================================================================

export const serverApi = {
  /**
   * Herkese açık şirket profillerini yönetir.
   */
  publicProfile: {
    /**
     * Slug'a göre tek bir şirketin birleştirilmiş public verilerini getirir.
     */
    getBySlug: (slug: string) => get<CompanyPublicProfileDto>(`/api/publicprofile/business/${slug}`),
  },

  /**
   * Statik sayfaları yönetir.
   */
  pages: {
    /**
     * Slug'a göre tek bir sayfayı getirir.
     */
    getBySlug: (slug: string) => get<PageDto>(`/api/Pages/${slug}`),
    
    /**
     * Tüm sayfaları getirir (örn: generateStaticParams için).
     */
    getAll: () => get<PageDto[]>(`/api/Pages`),
  },
  
  /**
   * İşletme verilerini yönetir (eğer sunucuda gerekirse).
   */
  business: {
    /**
     * Tüm işletmeleri getirir.
     */
    getAll: () => get<BusinessDto[]>(`/api/Business`, true),
  },
  
  // İleride sunucu tarafında ihtiyaç duyulabilecek diğer fonksiyonlar için
  // buraya yeni bölümler ekleyebilirsiniz.
  // Örnek:
  // services: {
  //   getByBusinessId: (businessId: number) => get<ServiceDto[]>(`/api/business/${businessId}/services`),
  // },
};