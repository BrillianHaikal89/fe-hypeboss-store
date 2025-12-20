import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manajemen Produk - BossHype Store",
  description: "Kelola Produk BossHype Store",
};

export default function CategoriesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}