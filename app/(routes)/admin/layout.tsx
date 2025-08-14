import AdminLayout from "@/components/layouts/AdminLayout"; // AdminLayout.tsx dosyanızın yolunu doğru yazdığınızdan emin olun

// Bu dosyanın başında 'use client' YOK. Bu bir Server Component.
export default function LayoutForAdminPages({
  children,
}: {
  children: React.ReactNode;
}) {
  // Burada hiçbir hook KULLANILMAZ.
  // Görevi sadece client component'i sarmalamaktır.
  return <AdminLayout>{children}</AdminLayout>;
}