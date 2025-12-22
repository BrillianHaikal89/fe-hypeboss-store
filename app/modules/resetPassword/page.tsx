// app/modules/resetPassword/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft,
  Lock,
  Phone,
  Shield,
  CheckCircle,
  Eye,
  EyeOff,
  Key,
  Clock,
  Store
} from "lucide-react";

type ResetStep = "request" | "verify" | "confirm";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<ResetStep>("request");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [timer, setTimer] = useState(600); // 10 menit dalam detik
  const [canResend, setCanResend] = useState(false);

  // Format timer menjadi MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Timer countdown
  useEffect(() => {
    if (currentStep === "verify" && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [currentStep, timer]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validasi nomor telepon
    if (!phone.trim()) {
      setError("Masukkan nomor telepon");
      return;
    }

    if (!/^[0-9]{10,14}$/.test(phone.replace(/\D/g, ''))) {
      setError("Format nomor telepon tidak valid (10-14 digit)");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/auth/password/reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, '')
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("OTP telah dikirim ke nomor telepon Anda. Periksa SMS Anda.");
        setCurrentStep("verify");
        setTimer(600); // Reset timer ke 10 menit
        setCanResend(false);
      } else {
        setError(data.message || "Gagal mengirim OTP. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("Request reset error:", err);
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validasi OTP
    if (!otp.trim()) {
      setError("Masukkan OTP");
      return;
    }

    if (!/^[0-9]{6}$/.test(otp)) {
      setError("OTP harus 6 digit angka");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/auth/password/reset/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ''),
          otp: otp
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("OTP berhasil diverifikasi. Silakan buat kata sandi baru.");
        setCurrentStep("confirm");
      } else {
        setError(data.message || "OTP tidak valid. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validasi password
    if (!newPassword.trim()) {
      setError("Masukkan kata sandi baru");
      return;
    }

    if (!confirmPassword.trim()) {
      setError("Konfirmasi kata sandi baru");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Kata sandi tidak cocok");
      return;
    }

    if (newPassword.length < 8) {
      setError("Kata sandi minimal 8 karakter");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/auth/password/reset/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ''),
          otp: otp,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("Password berhasil direset! Anda akan diarahkan ke halaman login.");
        
        // Redirect ke halaman login setelah 3 detik
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(data.message || "Gagal mereset password. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("Confirm reset error:", err);
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!canResend) return;

    setError("");
    setCanResend(false);
    setTimer(600);

    try {
      const response = await fetch("http://localhost:3001/api/auth/password/reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, '')
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("OTP baru telah dikirim ke nomor telepon Anda.");
      } else {
        setError(data.message || "Gagal mengirim ulang OTP.");
        setCanResend(true);
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError("Terjadi kesalahan jaringan.");
      setCanResend(true);
    }
  };

  const handleBack = () => {
    if (currentStep === "verify") {
      setCurrentStep("request");
      setOtp("");
    } else if (currentStep === "confirm") {
      setCurrentStep("verify");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      router.back();
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-emerald-50 to-white">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-emerald-700 hidden sm:inline">
                Bosshype Store
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                {["Request", "Verifikasi", "Reset"].map((step, index) => {
                  const stepNumber = index + 1;
                  const stepState = 
                    stepNumber === 1 ? (currentStep === "request" ? "active" : "completed") :
                    stepNumber === 2 ? (currentStep === "verify" ? "active" : currentStep === "confirm" ? "completed" : "pending") :
                    (currentStep === "confirm" ? "active" : "pending");
                  
                  return (
                    <div key={step} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                        stepState === "active" 
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg" 
                          : stepState === "completed" 
                          ? "bg-emerald-100 text-emerald-600" 
                          : "bg-gray-100 text-gray-400"
                      }`}>
                        {stepState === "completed" ? "✓" : stepNumber}
                      </div>
                      <span className={`text-sm font-medium hidden sm:inline ${
                        stepState === "active" 
                          ? "text-emerald-600" 
                          : stepState === "completed" 
                          ? "text-emerald-500" 
                          : "text-gray-400"
                      }`}>
                        {step}
                      </span>
                      
                      {index < 2 && (
                        <div className={`w-8 h-0.5 sm:w-12 ${
                          stepState === "completed" 
                            ? "bg-emerald-500" 
                            : "bg-gray-200"
                        }`}></div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentStep === "request" && "Reset Kata Sandi"}
                  {currentStep === "verify" && "Verifikasi OTP"}
                  {currentStep === "confirm" && "Buat Kata Sandi Baru"}
                </h1>
                <p className="text-gray-600 text-sm">
                  {currentStep === "request" && "Masukkan nomor telepon terdaftar untuk mengirim OTP"}
                  {currentStep === "verify" && "Masukkan 6 digit kode OTP yang dikirim ke telepon Anda"}
                  {currentStep === "confirm" && "Buat kata sandi baru untuk akun Anda"}
                </p>
              </div>
            </div>

            {/* Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              {/* Success Message */}
              {successMessage && (
                <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <p className="text-emerald-700 text-xs font-medium">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    <p className="text-red-600 text-xs font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Request Step */}
              {currentStep === "request" && (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Nomor Telepon Terdaftar
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Phone className="w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 group-hover:border-emerald-400"
                        placeholder="082126510230"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Pastikan nomor telepon terdaftar di Bosshype Store
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Mengirim OTP...
                      </div>
                    ) : (
                      <span className="relative flex items-center justify-center gap-1.5 text-sm">
                        Kirim Kode OTP
                        <Key className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                </form>
              )}

              {/* Verify Step */}
              {currentStep === "verify" && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Kode OTP
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Key className="w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200" />
                      </div>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 group-hover:border-emerald-400 text-center text-lg tracking-widest"
                        placeholder="123456"
                        maxLength={6}
                        required
                      />
                    </div>
                    
                    {/* Timer and Resend */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>Berlaku hingga: {formatTime(timer)}</span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={resendOtp}
                        disabled={!canResend}
                        className={`text-xs font-medium ${canResend ? 'text-emerald-600 hover:text-emerald-700' : 'text-gray-400 cursor-not-allowed'}`}
                      >
                        Kirim ulang OTP
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-300"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Memverifikasi...
                        </div>
                      ) : (
                        <span className="relative flex items-center justify-center gap-1.5 text-sm">
                          Verifikasi
                          <CheckCircle className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Confirm Step */}
              {currentStep === "confirm" && (
                <form onSubmit={handleConfirmReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Kata Sandi Baru
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Lock className="w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 group-hover:border-emerald-400"
                        placeholder="Minimal 8 karakter"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors duration-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Shield className="w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 group-hover:border-emerald-400"
                        placeholder="Ketik ulang kata sandi baru"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors duration-200"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-300"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Mereset...
                        </div>
                      ) : (
                        <span className="relative flex items-center justify-center gap-1.5 text-sm">
                          Reset Password
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Security Info */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-md">
                    <Shield className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">
                      Proses Reset Password Aman
                    </p>
                    <p className="text-xs text-gray-500">
                      Data Anda terlindungi dengan enkripsi end-to-end
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Link */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-600">
                Ingat kata sandi?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
                >
                  Kembali ke Login
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Global Footer */}
        <div className="py-3 px-6 border-t border-gray-100 bg-white/50 text-center">
          <p className="text-xs text-gray-500">
            © 2025 Bosshype Store • Reset Password • Fashion Digital Terpercaya
          </p>
        </div>
      </div>
    </div>
  );
}