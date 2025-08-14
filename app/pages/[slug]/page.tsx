// app/pages/[slug]/page.tsx - SERVER-SIDE ORVAL ENTEGRASYONU İLE NİHAİ SÜRÜM

import { notFound } from "next/navigation";
// DÜZELTME 1: Yeni serverApi istemcisini ve DTO tipini import et
import { serverApi } from "@/lib/api/server-api";
import type { PageDto } from "@/lib/api/generated/model";

// Prop tiplerini tanımla
interface PageProps {
  params: Promise<{ slug: string }>; // Next.js 15'e hazırlık için Promise
}

/**
 * Build sırasında statik olarak oluşturulacak sayfaların yollarını (slug'larını) belirler.
 */
export async function generateStaticParams() {
  try {
    const pages = await serverApi.pages.getAll();
    
    // Yalnızca yayınlanmış sayfalar için statik yollar oluştur
    const publishedPages = pages?.filter(p => p.isPublished) ?? [];

    return publishedPages.map((page) => ({
      slug: page.slug,
    }));
  } catch (error) {
    console.error("Could not generate static params for pages:", error);
    return [];
  }
}

/**
 * Sayfanın <head> etiketindeki SEO meta verilerini dinamik olarak oluşturur.
 */
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  
  try {
    // DÜZELTME 2: Orval fonksiyonu yerine serverApi'yi kullan
    const pageData = await serverApi.pages.getBySlug(slug);

    if (!pageData || !pageData.isPublished) {
      return { title: "Page Not Found" };
    }
    
    return { 
        title: pageData.metaTitle || pageData.title,
        description: pageData.metaDescription
    };
  } catch {
    return { title: "Page Not Found" };
  }
}

/**
 * Dinamik sayfayı render eden ana Server Component.
 */
export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;

  try {
    // DÜZELTME 3: Burada da serverApi'yi kullanıyoruz.
    const pageData = await serverApi.pages.getBySlug(slug);

    // Sayfa bulunamadıysa veya henüz yayınlanmadıysa 404 sayfasını göster.
    if (!pageData || !pageData.isPublished) {
      return notFound();
    }

    return (
      <div className="container mx-auto px-4 py-16">
        <article className="prose lg:prose-xl dark:prose-invert mx-auto">
          {pageData.title && <h1>{pageData.title}</h1>}
          
          {pageData.content ? (
            <div dangerouslySetInnerHTML={{ __html: pageData.content }} />
          ) : (
            <p>This page is currently empty.</p>
          )}
        </article>
      </div>
    );
  } catch (error) {
    console.error(`[DynamicPage] Error fetching page for slug: ${slug}`, error);
    // API isteği tamamen başarısız olursa 404 sayfasını göster.
    notFound();
  }
}