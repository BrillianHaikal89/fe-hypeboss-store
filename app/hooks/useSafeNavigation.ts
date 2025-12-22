// hooks/useSafeBackNavigation.ts
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export const useSafeNavigation = (defaultRoute: string = '/modules/dashboard') => {
  const router = useRouter();
  
  const safeBack = useCallback(() => {
    const previousPage = document.referrer;
    const currentHost = window.location.host;
    
    // Cek jika referer adalah halaman dashboard
    if (previousPage && previousPage.includes('/modules/dashboard') && previousPage.includes(currentHost)) {
      router.push(defaultRoute);
    } else if (previousPage && previousPage.includes(currentHost)) {
      router.back();
    } else {
      router.push(defaultRoute);
    }
  }, [router, defaultRoute]);
  
  const navigateTo = useCallback((route: string) => {
    router.push(route);
  }, [router]);
  
  return { safeBack, navigateTo };
};