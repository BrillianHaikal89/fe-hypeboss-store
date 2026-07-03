export interface User {
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

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export async function login(identifier: string, password: string): Promise<AuthResponse> {
  const response = await fetch("https://be-hypeboss-store-fawn.vercel.app/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ identifier, password }),
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  return response.json();
}

export function saveAuthData(token: string, user: User, rememberMe: boolean = false) {
  localStorage.setItem("bosshype_token", token);
  localStorage.setItem("bosshype_user", JSON.stringify(user));
  
  if (rememberMe) {
    sessionStorage.setItem("bosshype_remember", "true");
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem("bosshype_token");
}

export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem("bosshype_user");
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export function logout(): void {
  localStorage.removeItem("bosshype_token");
  localStorage.removeItem("bosshype_user");
  sessionStorage.removeItem("bosshype_remember");
}