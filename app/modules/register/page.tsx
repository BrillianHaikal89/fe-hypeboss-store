// app/modules/register/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  Phone,
  Lock,
  UserCircle,
  MapPin,
  CheckCircle,
  XCircle,
  Store,
  Shield,
  ArrowLeft,
  Key,
  Smartphone,
  Home,
  Eye,
  EyeOff,
  AlertCircle,
  Mail,
  RotateCw
} from 'lucide-react'

type RegisterStep = 'personal' | 'account' | 'otp'

export default function RegisterPage () {
  const router = useRouter()
  const [step, setStep] = useState<RegisterStep>('personal')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    address: ''
  })

  const [otpData, setOtpData] = useState({
    phone: '',
    otp: '',
    otpSent: false,
    countdown: 0,
    canResend: false
  })

  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    address: ''
  })

  // Hitung strength password
  useEffect(() => {
    if (formData.password) {
      let strength = 0
      if (formData.password.length >= 8) strength += 25
      if (/[A-Z]/.test(formData.password)) strength += 25
      if (/[0-9]/.test(formData.password)) strength += 25
      if (/[^A-Za-z0-9]/.test(formData.password)) strength += 25
      setPasswordStrength(strength)
    } else {
      setPasswordStrength(0)
    }
  }, [formData.password])

  // Countdown timer untuk resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (otpData.countdown > 0) {
      interval = setInterval(() => {
        setOtpData(prev => ({
          ...prev,
          countdown: prev.countdown - 1,
          canResend: prev.countdown - 1 === 0
        }))
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [otpData.countdown])

  const validateField = useCallback(
    (name: string, value: string) => {
      let error = ''

      switch (name) {
        case 'phone':
          if (!value.trim()) {
            error = 'Nomor telepon harus diisi'
          } else if (!/^[0-9]{10,14}$/.test(value)) {
            error = 'Format nomor telepon tidak valid (10-14 digit)'
          }
          break

        case 'full_name':
          if (!value.trim()) {
            error = 'Nama lengkap harus diisi'
          } else if (value.trim().length < 3) {
            error = 'Nama minimal 3 karakter'
          }
          break

        case 'address':
          if (!value.trim()) {
            error = 'Alamat harus diisi'
          } else if (value.trim().length < 10) {
            error = 'Alamat terlalu pendek'
          }
          break

        case 'username':
          if (!value.trim()) {
            error = 'Username harus diisi'
          } else if (value.length < 3) {
            error = 'Username minimal 3 karakter'
          } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            error = 'Username hanya boleh huruf, angka, dan underscore'
          }
          break

        case 'password':
          if (!value) {
            error = 'Password harus diisi'
          } else if (value.length < 8) {
            error = 'Password minimal 8 karakter'
          }
          break

        case 'confirmPassword':
          if (value !== formData.password) {
            error = 'Konfirmasi password tidak sesuai'
          }
          break
      }

      return error
    },
    [formData.password]
  )

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    let processedValue = value

    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '')
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }))

    const error = validateField(name, processedValue)
    setFieldErrors(prev => ({ ...prev, [name]: error }))

    if (error && step !== 'otp') {
      setError('')
    }
  }

  const handleOtpChange = (value: string) => {
    setOtpData(prev => ({ ...prev, otp: value }))
    if (error) setError('')
  }

  const validatePersonalStep = () => {
    const errors = {
      phone: validateField('phone', formData.phone),
      full_name: validateField('full_name', formData.full_name),
      address: validateField('address', formData.address)
    }

    setFieldErrors(prev => ({ ...prev, ...errors }))
    return !errors.phone && !errors.full_name && !errors.address
  }

  const validateAccountStep = () => {
    const errors = {
      username: validateField('username', formData.username),
      password: validateField('password', formData.password),
      confirmPassword: validateField(
        'confirmPassword',
        formData.confirmPassword
      )
    }

    setFieldErrors(prev => ({ ...prev, ...errors }))
    return !errors.username && !errors.password && !errors.confirmPassword
  }

  const handleNextStep = async () => {
    if (step === 'personal') {
      if (!validatePersonalStep()) {
        setError('Harap perbaiki data yang masih salah')
        return
      }
      setStep('account')
      setError('')
      setSuccessMessage('')
    } else if (step === 'account') {
      if (!validateAccountStep()) {
        setError('Harap perbaiki data yang masih salah')
        return
      }
      await handleRegisterSubmit()
    }
  }

  const handleRegisterSubmit = async () => {
    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          phone: formData.phone,
          password: formData.password,
          full_name: formData.full_name,
          address: formData.address
        })
      })

      const data = await response.json()

      if (data.success) {
        setOtpData(prev => ({
          ...prev,
          phone: formData.phone,
          otpSent: true,
          countdown: 60,
          canResend: false
        }))

        setStep('otp')
        setSuccessMessage(
          'Registrasi berhasil! Kode OTP telah dikirim ke nomor Anda.'
        )

        if (data.token) {
          localStorage.setItem('register_token', data.token)
        }
      } else {
        setError(data.message || 'Registrasi gagal. Silakan coba lagi.')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!otpData.canResend) return

    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch(
        'http://localhost:3001/api/auth/resend-otp',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: otpData.phone })
        }
      )

      const data = await response.json()

      if (data.success) {
        setOtpData(prev => ({
          ...prev,
          countdown: 60,
          canResend: false
        }))
        setSuccessMessage('Kode OTP telah dikirim ulang ke nomor Anda.')
      } else {
        setError(data.message || 'Gagal mengirim ulang OTP. Silakan coba lagi.')
      }
    } catch (err) {
      console.error('Resend OTP error:', err)
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otpData.otp) {
      setError('Masukkan kode OTP')
      return
    }

    if (otpData.otp.length !== 6) {
      setError('Kode OTP harus 6 digit')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const token = localStorage.getItem('register_token')

      const response = await fetch(
        'http://localhost:3001/api/auth/verify-otp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            phone: otpData.phone,
            otp: otpData.otp
          })
        }
      )

      const data = await response.json()

      if (data.success) {
        setSuccessMessage(
          'Verifikasi berhasil! Akun Anda telah aktif. Mengalihkan...'
        )

        localStorage.removeItem('register_token')

        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setError(data.message || 'Kode OTP tidak valid. Silakan coba lagi.')
      }
    } catch (err) {
      console.error('Verify OTP error:', err)
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const goBackToPersonal = () => {
    setStep('personal')
    setError('')
    setSuccessMessage('')
    setFieldErrors({
      username: '',
      phone: '',
      password: '',
      confirmPassword: '',
      full_name: '',
      address: ''
    })
  }

  const goBackToAccount = () => {
    setStep('account')
    setError('')
    setSuccessMessage('')
  }

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      {
        key: 'personal',
        label: 'Data Pribadi',
        icon: <UserCircle className='w-3 h-3' />
      },
      { key: 'account', label: 'Akun', icon: <Key className='w-3 h-3' /> },
      {
        key: 'otp',
        label: 'Verifikasi',
        icon: <Smartphone className='w-3 h-3' />
      }
    ]

    return (
      <div className='mb-6'>
        <div className='relative mb-4'>
          <div className='absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2'></div>
          <div
            className='absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 transition-all duration-300'
            style={{
              width:
                step === 'personal'
                  ? '16.66%'
                  : step === 'account'
                  ? '50%'
                  : '100%'
            }}
          ></div>

          <div className='relative flex justify-between'>
            {steps.map(stepItem => {
              const isActive = step === stepItem.key
              const isCompleted =
                (stepItem.key === 'personal' && step !== 'personal') ||
                (stepItem.key === 'account' && step === 'otp')

              return (
                <div key={stepItem.key} className='flex flex-col items-center'>
                  <div
                    className={`
                    w-8 h-8 rounded-full flex items-center justify-center mb-1
                    ${
                      isActive
                        ? 'bg-emerald-500 text-white border-2 border-emerald-500 shadow-lg shadow-emerald-500/30'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-300'
                        : 'bg-white text-gray-400 border-2 border-gray-300'
                    }
                    transition-all duration-300
                    ${isActive ? 'scale-110' : ''}
                  `}
                  >
                    {isCompleted ? (
                      <CheckCircle className='w-4 h-4' />
                    ) : (
                      <div className='flex items-center justify-center'>
                        {stepItem.icon}
                      </div>
                    )}
                  </div>
                  <span
                    className={`
                    text-xs font-medium
                    ${
                      isActive
                        ? 'text-emerald-600'
                        : isCompleted
                        ? 'text-emerald-500'
                        : 'text-gray-500'
                    }
                  `}
                  >
                    {stepItem.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => {
                if (step === 'account') goBackToPersonal()
                else if (step === 'otp') goBackToAccount()
                else router.push('/login')
              }}
              className='p-1.5 rounded-lg hover:bg-emerald-50 transition-colors group'
              aria-label='Kembali'
            >
              <ArrowLeft className='w-4 h-4 text-gray-600 group-hover:text-emerald-600' />
            </button>
            <div>
              <h3 className='text-lg font-bold text-gray-900'>
                {step === 'personal'
                  ? 'Data Pribadi'
                  : step === 'account'
                  ? 'Data Akun'
                  : 'Verifikasi OTP'}
              </h3>
              <p className='text-xs text-gray-500'>
                {step === 'personal'
                  ? 'Isi data pribadi Anda'
                  : step === 'account'
                  ? 'Buat username dan password'
                  : 'Masukkan kode verifikasi'}
              </p>
            </div>
          </div>
          <div className='text-xs font-medium text-emerald-600'>
            Step {steps.findIndex(s => s.key === step) + 1} of 3
          </div>
        </div>
      </div>
    )
  }

  const renderFieldError = (fieldName: keyof typeof fieldErrors) => {
    if (!fieldErrors[fieldName]) return null

    return (
      <div className='mt-1 flex items-center gap-1 text-red-500 text-xs'>
        <AlertCircle className='w-3 h-3 flex-shrink-0' />
        <span>{fieldErrors[fieldName]}</span>
      </div>
    )
  }

  const renderPasswordStrength = () => {
    if (!formData.password) return null

    const getColor = () => {
      if (passwordStrength >= 75) return 'bg-emerald-500'
      if (passwordStrength >= 50) return 'bg-yellow-500'
      if (passwordStrength >= 25) return 'bg-orange-500'
      return 'bg-red-500'
    }

    return (
      <div className='mt-2'>
        <div className='flex justify-between items-center mb-1'>
          <span className='text-xs text-gray-600'>Kekuatan password:</span>
          <span className='text-xs font-medium text-gray-700'>
            {passwordStrength}%
          </span>
        </div>
        <div className='h-1.5 bg-gray-200 rounded-full overflow-hidden'>
          <div
            className={`h-full ${getColor()} transition-all duration-300`}
            style={{ width: `${passwordStrength}%` }}
          ></div>
        </div>
      </div>
    )
  }

  // Render OTP Verification Component
  const renderOtpVerification = () => {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center'>
            <Smartphone className='w-8 h-8 text-white' />
          </div>
          <h4 className='text-lg font-bold text-gray-900 mb-2'>
            Verifikasi Nomor Telepon
          </h4>
          <p className='text-gray-600 text-sm'>
            Kode OTP telah dikirim ke{' '}
            <span className='font-semibold'>{otpData.phone}</span>
          </p>
          <p className='text-gray-600 text-sm'>
            Masukkan 6 digit kode yang Anda terima
          </p>
        </div>

        {/* OTP Input */}
        <form onSubmit={handleVerifyOtp} className='space-y-4'>
          <div className='flex justify-center gap-2'>
            {[...Array(6)].map((_, index) => (
              <input
                key={index}
                type='text'
                maxLength={1}
                className='w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 bg-white'
                value={otpData.otp[index] || ''}
                onChange={e => {
                  const newOtp = otpData.otp.split('')
                  newOtp[index] = e.target.value.replace(/\D/g, '')
                  const updatedOtp = newOtp.join('')
                  handleOtpChange(updatedOtp)

                  // Auto focus ke input berikutnya
                  if (e.target.value && index < 5) {
                    const nextInput = document.getElementById(
                      `otp-input-${index + 1}`
                    )
                    nextInput?.focus()
                  }
                }}
                onKeyDown={e => {
                  if (
                    e.key === 'Backspace' &&
                    !otpData.otp[index] &&
                    index > 0
                  ) {
                    const prevInput = document.getElementById(
                      `otp-input-${index - 1}`
                    )
                    prevInput?.focus()
                  }
                }}
                id={`otp-input-${index}`}
              />
            ))}
          </div>

          {/* Resend OTP */}
          <div className='text-center'>
            {otpData.countdown > 0 ? (
              <p className='text-gray-500 text-sm'>
                Dapat mengirim ulang dalam{' '}
                <span className='font-semibold text-emerald-600'>
                  {otpData.countdown} detik
                </span>
              </p>
            ) : (
              <button
                type='button'
                onClick={handleResendOtp}
                disabled={!otpData.canResend || isLoading}
                className='text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center justify-center gap-1 mx-auto'
              >
                <RotateCw className='w-4 h-4' />
                Kirim Ulang Kode OTP
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className='flex gap-3'>
            <button
              type='button'
              onClick={goBackToAccount}
              disabled={isLoading}
              className='flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2'
            >
              <ArrowLeft className='w-3 h-3' />
              Kembali
            </button>
            <button
              type='submit'
              disabled={isLoading || otpData.otp.length !== 6}
              className='flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm relative overflow-hidden group'
            >
              <div className='absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000'></div>
              {isLoading ? (
                <div className='flex items-center justify-center relative z-10'>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
                  Memverifikasi...
                </div>
              ) : (
                <span className='flex items-center justify-center gap-2 relative z-10'>
                  Verifikasi
                  <CheckCircle className='w-4 h-4' />
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // Render form content berdasarkan step
  const renderFormContent = () => {
    if (step === 'personal') {
      return (
        <div className='space-y-4'>
          <div>
            <label className='block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1'>
              <UserCircle className='w-3 h-3 text-emerald-600' />
              Nama Lengkap
            </label>
            <div className='relative group'>
              <div className='absolute left-3 top-1/2 transform -translate-y-1/2'>
                <UserCircle className='w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200' />
              </div>
              <input
                type='text'
                name='full_name'
                value={formData.full_name}
                onChange={handleFormChange}
                className={`w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white text-gray-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 group-hover:border-emerald-300 text-sm ${
                  fieldErrors.full_name ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder='Masukkan nama lengkap'
                required
              />
            </div>
            {renderFieldError('full_name')}
          </div>

          <div>
            <label className='block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1'>
              <Smartphone className='w-3 h-3 text-emerald-600' />
              Nomor Telepon
            </label>
            <div className='relative group'>
              <div className='absolute left-3 top-1/2 transform -translate-y-1/2'>
                <Phone className='w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200' />
              </div>
              <input
                type='tel'
                name='phone'
                value={formData.phone}
                onChange={handleFormChange}
                className={`w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white text-gray-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 group-hover:border-emerald-300 text-sm ${
                  fieldErrors.phone ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder='contoh: 082126510230'
                required
                minLength={10}
                maxLength={14}
              />
            </div>
            {renderFieldError('phone')}
          </div>

          <div>
            <label className='block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1'>
              <Home className='w-3 h-3 text-emerald-600' />
              Alamat
            </label>
            <div className='relative group'>
              <div className='absolute left-3 top-1/2 transform -translate-y-1/2'>
                <MapPin className='w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200' />
              </div>
              <input
                type='text'
                name='address'
                value={formData.address}
                onChange={handleFormChange}
                className={`w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white text-gray-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 group-hover:border-emerald-300 text-sm ${
                  fieldErrors.address ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder='Masukkan alamat lengkap'
                required
              />
            </div>
            {renderFieldError('address')}
          </div>
        </div>
      )
    } else if (step === 'account') {
      return (
        <div className='space-y-4'>
          <div>
            <label className='block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1'>
              <User className='w-3 h-3 text-emerald-600' />
              Username
            </label>
            <div className='relative group'>
              <div className='absolute left-3 top-1/2 transform -translate-y-1/2'>
                <User className='w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200' />
              </div>
              <input
                type='text'
                name='username'
                value={formData.username}
                onChange={handleFormChange}
                className={`w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white text-gray-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 group-hover:border-emerald-300 text-sm ${
                  fieldErrors.username ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder='contoh: brillian_h'
                required
                minLength={3}
              />
            </div>
            {renderFieldError('username')}
          </div>

          <div>
            <label className='block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1'>
              <Key className='w-3 h-3 text-emerald-600' />
              Kata Sandi
            </label>
            <div className='relative group'>
              <div className='absolute left-3 top-1/2 transform -translate-y-1/2'>
                <Lock className='w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200' />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name='password'
                value={formData.password}
                onChange={handleFormChange}
                className={`w-full pl-10 pr-10 py-2.5 border rounded-lg bg-white text-gray-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 group-hover:border-emerald-300 text-sm ${
                  fieldErrors.password ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder='Minimal 8 karakter'
                required
                minLength={8}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors'
                aria-label={
                  showPassword ? 'Sembunyikan password' : 'Tampilkan password'
                }
              >
                {showPassword ? (
                  <EyeOff className='w-4 h-4' />
                ) : (
                  <Eye className='w-4 h-4' />
                )}
              </button>
            </div>
            {renderPasswordStrength()}
            {renderFieldError('password')}
          </div>

          <div>
            <label className='block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1'>
              <Key className='w-3 h-3 text-emerald-600' />
              Konfirmasi Kata Sandi
            </label>
            <div className='relative group'>
              <div className='absolute left-3 top-1/2 transform -translate-y-1/2'>
                <Lock className='w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200' />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name='confirmPassword'
                value={formData.confirmPassword}
                onChange={handleFormChange}
                className={`w-full pl-10 pr-10 py-2.5 border rounded-lg bg-white text-gray-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 group-hover:border-emerald-300 text-sm ${
                  fieldErrors.confirmPassword
                    ? 'border-red-300'
                    : 'border-gray-200'
                }`}
                placeholder='Ulangi kata sandi'
                required
                minLength={8}
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors'
                aria-label={
                  showConfirmPassword
                    ? 'Sembunyikan password'
                    : 'Tampilkan password'
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className='w-4 h-4' />
                ) : (
                  <Eye className='w-4 h-4' />
                )}
              </button>
            </div>
            {renderFieldError('confirmPassword')}
          </div>
        </div>
      )
    } else {
      return renderOtpVerification()
    }
  }

  // Render action buttons berdasarkan step
  const renderActionButtons = () => {
    if (step === 'personal') {
      return (
        <button
          type='button'
          onClick={handleNextStep}
          disabled={
            isLoading ||
            !formData.full_name ||
            !formData.phone ||
            !formData.address
          }
          className='w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm relative overflow-hidden group'
        >
          <div className='absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000'></div>
          {isLoading ? (
            <div className='flex items-center justify-center relative z-10'>
              <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
              Memproses...
            </div>
          ) : (
            <span className='flex items-center justify-center gap-2 relative z-10'>
              Selanjutnya
              <svg
                className='w-4 h-4'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M14 5l7 7m0 0l-7 7m7-7H3'
                />
              </svg>
            </span>
          )}
        </button>
      )
    } else if (step === 'account') {
      return (
        <div className='flex gap-3'>
          <button
            type='button'
            onClick={goBackToPersonal}
            disabled={isLoading}
            className='flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2'
          >
            <ArrowLeft className='w-3 h-3' />
            Kembali
          </button>
          <button
            type='button'
            onClick={handleNextStep}
            disabled={
              isLoading ||
              !formData.username ||
              !formData.password ||
              !formData.confirmPassword
            }
            className='flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm relative overflow-hidden group'
          >
            <div className='absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000'></div>
            {isLoading ? (
              <div className='flex items-center justify-center relative z-10'>
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
                Memproses...
              </div>
            ) : (
              <span className='flex items-center justify-center gap-2 relative z-10'>
                Daftar
                <CheckCircle className='w-4 h-4' />
              </span>
            )}
          </button>
        </div>
      )
    }
    return null
  }

  return (
    <div className='h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 overflow-auto'>
      <div className='min-h-full flex flex-col lg:flex-row'>
        {/* Left Side - Brand & Info (Desktop only) */}
        <div className='hidden lg:flex lg:w-1/2 flex-col p-8'>
          <div className='flex items-center gap-4 mb-8'>
            <div className='w-14 h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30'>
              <Store className='w-7 h-7 text-white' />
            </div>
            <div>
              <h1 className='text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent'>
                Bosshype Store
              </h1>
              <p className='text-emerald-600 font-medium text-sm'>
                Bergabung Bersama Kami
              </p>
            </div>
          </div>

          <div className='mb-8'>
            <h2 className='text-3xl font-bold text-gray-900 mb-3'>
              Bergabung dengan Bosshype Store
            </h2>
            <p className='text-gray-600 leading-relaxed'>
              Daftar sekarang untuk akses eksklusif ke koleksi fashion terbaru,
              promo spesial, dan pengalaman belanja yang aman dan nyaman.
            </p>
          </div>

          <div className='space-y-4 mt-8'>
            {[
              {
                icon: <UserCircle className='w-4 h-4' />,
                title: 'Data Pribadi Lengkap',
                desc: 'Lengkapi data diri untuk pengalaman belanja yang personal',
                stepKey: 'personal'
              },
              {
                icon: <Key className='w-4 h-4' />,
                title: 'Keamanan Akun',
                desc: 'Password kuat untuk melindungi data pribadi Anda',
                stepKey: 'account'
              },
              {
                icon: <Smartphone className='w-4 h-4' />,
                title: 'Verifikasi Aman',
                desc: 'OTP untuk memastikan keamanan akun Anda',
                stepKey: 'otp'
              }
            ].map(item => (
              <div
                key={item.stepKey}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                  step === item.stepKey
                    ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    step === item.stepKey
                      ? 'bg-emerald-500 scale-110'
                      : 'bg-emerald-100'
                  }`}
                >
                  <div
                    className={
                      step === item.stepKey ? 'text-white' : 'text-emerald-600'
                    }
                  >
                    {item.icon}
                  </div>
                </div>
                <div>
                  <h3
                    className={`font-semibold text-sm ${
                      step === item.stepKey
                        ? 'text-emerald-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p className='text-gray-600 text-xs'>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className='mt-auto pt-8'>
            <div className='flex items-center gap-2 mb-2'>
              <Shield className='w-4 h-4 text-emerald-500' />
              <span className='text-sm font-medium text-gray-700'>
                Keamanan Terjamin
              </span>
            </div>
            <p className='text-xs text-gray-500'>
              Data Anda dilindungi dengan enkripsi SSL 256-bit dan tidak akan
              dibagikan kepada pihak ketiga.
            </p>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className='flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8'>
          <div className='max-w-md w-full'>
            {/* Mobile Header */}
            <div className='lg:hidden mb-6'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center'>
                  <Store className='w-5 h-5 text-white' />
                </div>
                <div>
                  <h1 className='text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent'>
                    Bosshype Store
                  </h1>
                  <p className='text-emerald-600 text-xs'>Daftar Sekarang</p>
                </div>
              </div>
              <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                Buat Akun Baru
              </h2>
              <p className='text-gray-600 text-sm'>
                Bergabung dengan komunitas fashion terbaik
              </p>
            </div>

            {/* Registration Card */}
            <div className='bg-white rounded-xl shadow-lg p-6 border border-gray-100'>
              {/* Step Indicator */}
              {renderStepIndicator()}

              {/* Success Message */}
              {successMessage && (
                <div className='mb-4 p-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className='w-4 h-4 text-emerald-500 flex-shrink-0' />
                    <p className='text-emerald-700 text-xs font-medium'>
                      {successMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className='mb-4 p-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg'>
                  <div className='flex items-center gap-2'>
                    <XCircle className='w-4 h-4 text-red-500 flex-shrink-0' />
                    <p className='text-red-600 text-xs font-medium'>{error}</p>
                  </div>
                </div>
              )}

              {/* Form Content */}
              <div className='mb-6'>{renderFormContent()}</div>

              {/* Action Buttons */}
              <div className='mb-6'>{renderActionButtons()}</div>

              {/* Login Link */}
              {step !== 'otp' && (
                <div className='pt-4 border-t border-gray-100 text-center'>
                  <p className='text-gray-600 text-sm'>
                    Sudah punya akun?{' '}
                    <Link
                      href='/login'
                      className='font-semibold text-emerald-600 hover:text-emerald-700 transition-colors duration-200 inline-flex items-center gap-1'
                    >
                      Masuk di sini
                      <svg
                        className='w-3 h-3'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M14 5l7 7m0 0l-7 7m7-7H3'
                        />
                      </svg>
                    </Link>
                  </p>
                </div>
              )}

              {/* Terms & Privacy */}
              {step !== 'otp' && (
                <div className='mt-4'>
                  <p className='text-xs text-gray-500 text-center'>
                    Dengan mendaftar, Anda menyetujui{' '}
                    <Link
                      href='/terms'
                      className='text-emerald-600 hover:text-emerald-700 hover:underline'
                    >
                      Syarat & Ketentuan
                    </Link>{' '}
                    dan{' '}
                    <Link
                      href='/privacy'
                      className='text-emerald-600 hover:text-emerald-700 hover:underline'
                    >
                      Kebijakan Privasi
                    </Link>{' '}
                    kami
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {/* Footer */}
            <div className='mt-4 text-center'>
              <p className='text-xs text-gray-500'>
                © 2024 Bosshype Store • Fashion Digital Terpercaya
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
