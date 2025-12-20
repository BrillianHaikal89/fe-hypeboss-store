import type { Metadata } from "next";
import DashboardNavbar from "../../components/dashboard/navbar";

export const metadata: Metadata = {
  title: "Dashboard - BossHype Store",
  description: "Dashboard manajemen penjualan BossHype Store",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <main className="pt-16 md:pt-4 px-0 md:px-6">
        <div className="max-w-screen-2xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}