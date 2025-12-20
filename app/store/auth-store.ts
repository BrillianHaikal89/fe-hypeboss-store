import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  phone: string;
  full_name: string;
  role: string;
  profile_picture: string | null;
  phone_verified: boolean;
  is_active: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  initializeAuth: () => void;
  isAuthenticated: () => boolean; // Tambah fungsi ini
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setIsLoading: (isLoading) => set({ isLoading }),
      
      login: (token, user) => {
        set({ token, user, isLoading: false });
        localStorage.setItem('bosshype_token', token);
        localStorage.setItem('bosshype_user', JSON.stringify(user));
      },
      
      logout: () => {
        set({ token: null, user: null, isLoading: false });
        localStorage.removeItem('bosshype_token');
        localStorage.removeItem('bosshype_user');
        localStorage.removeItem('bosshype_remember');
      },
      
      initializeAuth: () => {
        const storedToken = localStorage.getItem('bosshype_token');
        const storedUser = localStorage.getItem('bosshype_user');
        
        if (storedToken && storedUser) {
          try {
            set({ 
              token: storedToken, 
              user: JSON.parse(storedUser),
              isLoading: false 
            });
          } catch (error) {
            console.error('Error parsing stored user data:', error);
            localStorage.removeItem('bosshype_token');
            localStorage.removeItem('bosshype_user');
            set({ token: null, user: null, isLoading: false });
          }
        } else {
          set({ token: null, user: null, isLoading: false });
        }
      },
      
      // Fungsi untuk mengecek apakah user sudah login
      isAuthenticated: () => {
        const state = get();
        return !!(state.token && state.user);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
    }
  )
);