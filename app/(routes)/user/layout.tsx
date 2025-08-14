import UserLayout from "@/components/layouts/UserLayout"; // UserLayout.tsx dosyanızın yolunu doğru yazdığınızdan emin olun

// Bu dosyanın başında 'use client' YOK. Bu bir Server Component.
export default function LayoutForUserPages({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserLayout>{children}</UserLayout>;
}