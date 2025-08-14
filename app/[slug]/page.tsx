// app/[slug]/page.tsx - SUNUCU TARAFINDA ÇALIŞAN, NİHAİ VE EKSİKSİZ SAYFA

import { notFound } from "next/navigation";
import { serverApi } from "@/lib/api/server-api";
import type { CompanyPublicProfileDto } from "@/lib/api/generated/model";
import { Button } from "@/components/ui/button";

// Prop tiplerini tanımlıyoruz
interface CompanyPageProps {
  params: Promise< { slug: string }>;
}

/**
 * Build sırasında statik olarak oluşturulacak sayfaların yollarını (slug'larını) belirler.
 * Bu, sitenizin performansını önemli ölçüde artırır.
 * Yeni bir işletme eklendiğinde, bu sayfa ilk ziyarette sunucuda oluşturulur ve cache'lenir.
 */
export async function generateStaticParams() {
  try {
    // NOT: `serverApi`'ye tüm işletmeleri çeken bir fonksiyon eklememiz gerekebilir.
    // Şimdilik boş bırakıyoruz, bu durumda sayfalar ilk ziyarette oluşturulur (On-demand ISR).
    // const businesses = await serverApi.business.getAll();
    // return businesses?.map((business) => ({ slug: business.slug })) ?? [];
    return [];
  } catch (error) {
    console.error("Could not generate static params for company pages:", error);
    return [];
  }
}

/**
 * Sayfanın <head> etiketindeki SEO meta verilerini dinamik olarak oluşturur.
 */
export async function generateMetadata({ params }: CompanyPageProps) {
  const { slug } = await params;
  
  try {
    const companyData = await serverApi.publicProfile.getBySlug(slug);

    if (!companyData) {
      return { title: "Company Not Found" };
    }

    return { 
        title: `${companyData.name} • Book an Appointment`,
        description: `View services, team, and working hours for ${companyData.name}. Book your appointment today.`
    };
  } catch {
    return { title: "Company Not Found" };
  }
}

/**
 * Dinamik şirket profil sayfasını render eden ana Server Component.
 */
export default async function CompanyPage({ params }: CompanyPageProps) {
  const { slug } = await params;

  try {
    // Sunucu tarafında, slug'a göre tüm şirket verisini tek bir API isteğinde çekiyoruz.
    // Next.js bu isteği `generateMetadata`'daki ile otomatik olarak birleştirir.
    const companyData = await serverApi.publicProfile.getBySlug(slug);

    // Eğer API'den veri gelmezse (null dönerse), 404 sayfasını göster.
    if (!companyData) {
      return notFound();
    }

    // JSX kısmı: Çekilen veri ile sayfayı oluştur.
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <header className="bg-white dark:bg-gray-950 shadow-sm p-4 border-b">
            <div className="container mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{companyData.name}</h1>
                <p className="text-gray-500 dark:text-gray-400">{companyData.address}</p>
            </div>
        </header>

        <main className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="md:col-span-2 space-y-8">
                <section>
                    <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Our Services</h2>
                    {(companyData.services && companyData.services.length > 0) ? (
                        <ul className="space-y-4">
                            {companyData.services.map(service => (
                                <li key={service.id} className="p-4 bg-white dark:bg-gray-950 rounded-lg shadow-sm border">
                                    <h3 className="font-bold">{service.name}</h3>
                                    <p className="text-gray-600 dark:text-gray-400">{service.durationInMinutes} min - {service.price} TL</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500">No services available at the moment.</p>
                    )}
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Our Team</h2>
                    {(companyData.staff && companyData.staff.length > 0) ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {companyData.staff.map(staffMember => (
                                <div key={staffMember.id} className="text-center">
                                    <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-2 border"></div>
                                    <p className="font-medium mt-2">{staffMember.name}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">Team information is not available.</p>
                    )}
                </section>
            </div>

            <aside className="space-y-8 md:sticky md:top-8">
                 <section className="p-4 bg-white dark:bg-gray-950 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4">Working Hours</h2>
                    {(companyData.workingHours && companyData.workingHours.length > 0) ? (
                        <ul className="space-y-2 text-sm">
                        {companyData.workingHours.map(wh => (
                            <li key={wh.dayOfWeek} className="flex justify-between">
                                <span>{wh.dayOfWeek}</span>
                                <span className="font-mono">{wh.isActive ? `${wh.startTime} - ${wh.endTime}` : 'Closed'}</span>
                            </li>
                        ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-sm">Working hours not specified.</p>
                    )}
                 </section>
                 
                 <Button size="lg" className="w-full h-12 text-base">
                   Book an Appointment
                 </Button>
            </aside>
        </main>
      </div>
    );
  } catch (error) {
    // API isteği tamamen başarısız olursa Next.js'in 404 sayfasını göster.
    console.error(`[CompanyPage] Critical error fetching data for slug: ${slug}`, error);
    notFound();
  }
}