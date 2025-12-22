"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "./store/auth-store";

export default function HomePage() {
  const router = useRouter();
  const { token, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (token) {
        // Redirect ke dashboard yang sesuai
        router.replace("/modules/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [token, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-zinc-900 dark:to-zinc-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 font-medium">
            Loading BossHype Store...
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Preparing your premium shopping experience
          </p>
        </div>
      </div>
    );
  }

  return null;
}