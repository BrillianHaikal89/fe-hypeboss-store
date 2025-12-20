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
        // PERBAIKAN: Redirect ke /app/dashboard
        router.push("/login/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [token, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-zinc-900 dark:to-zinc-950">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
              <span className="text-3xl font-bold text-white">BH</span>
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl"></div>
          </div>
          
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