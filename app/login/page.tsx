// app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Eye, 
  EyeOff, 
  User,
  Phone, 
  Lock, 
  Shirt,
  ShoppingBag,
  Tag,
  Truck,
  Shield,
  Sparkles,
  CheckCircle,
  Store,
  TrendingUp,
  Users,
  CreditCard
} from "lucide-react";
import { useAuthStore } from "../store/auth-store";

type LoginMethod = "username" | "phone";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();
  
  const [isClient, setIsClient] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("username");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  // Slides untuk showcase produk
  const slides = [
    {
      icon: <Shirt className="w-12 h-12" />,
      title: "Koleksi Fashion Terbaru",
      description: "Temukan tren pakaian terkini untuk gaya Anda"
    },
    {
      icon: <ShoppingBag className="w-12 h-12" />,
      title: "Belanja Praktis",
      description: "Pengalaman belanja online yang mudah dan aman"
    },
    {
      icon: <Truck className="w-12 h-12" />,
      title: "Pengiriman Cepat",
      description: "Gratis ongkir untuk pembelian di atas Rp 500.000"
    },
    {
      icon: <Tag className="w-12 h-12" />,
      title: "Harga Terjangkau",
      description: "Kualitas premium dengan harga bersahabat"
    }
  ];

  // Set isClient true ketika component mount di client
  useEffect(() => {
    setIsClient(true);
    
    // Load saved identifier jika ada
    const savedIdentifier = localStorage.getItem("bosshype_identifier");
    if (savedIdentifier) {
      setIdentifier(savedIdentifier);
    }

    // Auto slide rotation
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Handle redirect jika sudah login
  useEffect(() => {
    if (isClient && isAuthenticated()) {
      router.push("/modules/dashboard");
    }
  }, [isClient, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    
    // Validasi input
    if (!identifier.trim()) {
      setError(loginMethod === "phone" 
        ? "Masukkan nomor telepon" 
        : "Masukkan username");
      return;
    }
    
    if (!password.trim()) {
      setError("Masukkan kata sandi");
      return;
    }

    // Validasi format phone number
    if (loginMethod === "phone" && !/^[0-9]{10,14}$/.test(identifier.replace(/\D/g, ''))) {
      setError("Format nomor telepon tidak valid (10-14 digit)");
      return;
    }
    
    setIsLoading(true);

    try {
      // API call untuk login
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: loginMethod === "phone" ? identifier.replace(/\D/g, '') : identifier,
          password: password
        })
      });

      const data = await response.json();

      if (data.success) {
        // Format user data sesuai kebutuhan store
        const userData = {
          id: data.data.user.id.toString(),
          username: data.data.user.username,
          email: "", // Tidak ada email di response API
          phone: data.data.user.phone,
          full_name: data.data.user.full_name,
          role: data.data.user.role,
          profile_picture: data.data.user.profile_picture,
          phone_verified: data.data.user.phone_verified,
          is_active: data.data.user.is_active,
          created_at: data.data.user.created_at
        };

        login(data.data.token, userData);
        
        if (rememberMe) {
          localStorage.setItem("bosshype_remember", "true");
          localStorage.setItem("bosshype_identifier", identifier);
        } else {
          localStorage.removeItem("bosshype_identifier");
        }
        
        setSuccessMessage("Login berhasil! Mengalihkan ke dashboard...");
        
        // Redirect ke dashboard setelah 1 detik
        setTimeout(() => {
          router.push("/modules/dashboard");
        }, 1000);
      } else {
        setError(data.message || "Login gagal. Periksa kredensial Anda.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setIdentifier("");
    setPassword("");
    setError("");
    setSuccessMessage("");
  };

  // Jika masih loading, tampilkan skeleton sederhana
  if (!isClient) {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-emerald-50 to-white">
        <div className="h-full flex">
          {/* Left side skeleton */}
          <div className="hidden lg:flex lg:w-1/2 p-12">
            <div className="max-w-md w-full">
              <div className="h-12 bg-emerald-200 rounded-lg w-48 mb-8 animate-pulse"></div>
              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-emerald-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right side skeleton */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
            <div className="max-w-md w-full">
              <div className="h-10 bg-emerald-200 rounded-lg w-64 mb-8 animate-pulse"></div>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-emerald-100 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-emerald-50 to-white">
      <div className="h-full flex flex-col lg:flex-row">
        {/* Left Side - Brand & Features (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col p-8 lg:p-12">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Store className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
                Bosshype Store
              </h1>
              <p className="text-emerald-600 font-medium">Fashion Digital Terdepan</p>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="mb-10">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Selamat Datang Kembali
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Masuk ke akun Anda dan jelajahi koleksi fashion terbaru kami. 
              Bosshype Store menghadirkan pengalaman belanja pakaian digital yang 
              modern, aman, dan terpercaya.
            </p>
          </div>

          {/* Product Showcase Slider */}
          <div className="relative h-64 bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-100 shadow-sm p-6 mb-8 overflow-hidden">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 p-6 transition-all duration-500 ease-in-out ${
                  index === activeSlide
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-full"
                }`}
              >
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-emerald-500 mb-4">
                    {slide.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {slide.title}
                  </h3>
                  <p className="text-gray-600">
                    {slide.description}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Slide Indicators */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === activeSlide
                      ? "bg-emerald-500 w-8"
                      : "bg-emerald-200"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-emerald-100 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <span className="text-2xl font-bold text-emerald-700">10K+</span>
              </div>
              <p className="text-xs text-gray-600">Pelanggan Aktif</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-emerald-100 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ShoppingBag className="w-4 h-4 text-emerald-500" />
                <span className="text-2xl font-bold text-emerald-700">5K+</span>
              </div>
              <p className="text-xs text-gray-600">Produk Fashion</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-emerald-100 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-2xl font-bold text-emerald-700">99%</span>
              </div>
              <p className="text-xs text-gray-600">Kepuasan</p>
            </div>
          </div>

          {/* Bottom Text */}
          <div className="mt-auto pt-8">
            <p className="text-sm text-gray-500">
              Bergabung dengan ribuan pelanggan yang telah mempercayai 
              <span className="font-semibold text-emerald-600"> Bosshype Store</span> 
              {" "}untuk kebutuhan fashion mereka.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="max-w-md w-full">
            {/* Mobile Header */}
            <div className="lg:hidden mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
                    Bosshype Store
                  </h1>
                  <p className="text-emerald-600 text-sm">Fashion Digital</p>
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Masuk ke Akun
              </h2>
              <p className="text-gray-600">
                Akses dashboard dan kelola akun Anda
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              {/* Login Method Selection */}
              <div className="flex gap-2 mb-8 p-1 bg-gradient-to-r from-emerald-50 to-white rounded-xl border border-emerald-100">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("username");
                    clearForm();
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                    loginMethod === "username"
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md"
                      : "text-gray-600 hover:text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <User className="w-4 h-4" />
                    Username
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("phone");
                    clearForm();
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                    loginMethod === "phone"
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md"
                      : "text-gray-600 hover:text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telepon
                  </div>
                </button>
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl animate-fade-in">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <p className="text-emerald-700 text-sm font-medium">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl animate-shake">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Identifier Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {loginMethod === "phone" ? "Nomor Telepon" : "Username"}
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      {loginMethod === "phone" ? (
                        <Phone className="w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200" />
                      ) : (
                        <User className="w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200" />
                      )}
                    </div>
                    <input
                      type={loginMethod === "phone" ? "tel" : "text"}
                      value={identifier}
                      onChange={(e) => {
                        if (loginMethod === "phone") {
                          const value = e.target.value.replace(/\D/g, '');
                          setIdentifier(value);
                        } else {
                          setIdentifier(e.target.value);
                        }
                      }}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-300 group-hover:border-emerald-300"
                      placeholder={
                        loginMethod === "phone"
                          ? "082126510230"
                          : "Masukkan username"
                      }
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Kata Sandi
                    </label>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Aman
                    </span>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-300 group-hover:border-emerald-300"
                      placeholder="Masukkan kata sandi"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors duration-200 p-1"
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center group cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="remember"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all duration-200 ${
                        rememberMe
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 border-transparent shadow-sm"
                          : "border-gray-300 group-hover:border-emerald-500"
                      }`}
                      >
                        {rememberMe && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <label
                      htmlFor="remember"
                      className="ml-3 text-sm text-gray-600 group-hover:text-gray-900 transition-colors cursor-pointer"
                    >
                      Ingat saya
                    </label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 flex items-center gap-1"
                  >
                    <Shield className="w-3 h-3" />
                    Lupa kata sandi?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      Memproses...
                    </div>
                  ) : (
                    <span className="relative flex items-center justify-center gap-2">
                      Masuk ke Dashboard
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  )}
                </button>
              </form>

              {/* Register Link */}
              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-600">
                  Belum punya akun?{" "}
                  <Link
                    href="/modules/register"
                    className="font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 inline-flex items-center gap-1"
                  >
                    Daftar Sekarang
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </p>
              </div>

              {/* Security Info */}
              <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-white rounded-xl border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Belanja Aman & Nyaman
                    </p>
                    <p className="text-xs text-gray-500">
                      Transaksi dienkripsi dengan teknologi terkini
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="mt-8 text-center lg:hidden">
              <p className="text-sm text-gray-500">
                © 2025 Bosshype Store • Fashion Digital Terpercaya
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Footer */}
      <div className="hidden lg:flex absolute bottom-4 left-0 right-0 justify-center">
        <p className="text-sm text-gray-500">
          © 2025 Bosshype Store • Menjual berbagai produk pakaian berkualitas • 
          <span className="text-emerald-600 font-medium"> Baju • Celana • Topi • Sepatu</span>
        </p>
      </div>

      {/* Add custom animations */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% {transform: translateX(0);}
          10%, 30%, 50%, 70%, 90% {transform: translateX(-5px);}
          20%, 40%, 60%, 80% {transform: translateX(5px);}
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}