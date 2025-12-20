import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manajemen Kategori - BossHype Store",
  description: "Kelola kategori produk BossHype Store",
};

export default function CategoriesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}