'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await loginAction(username, password)
      if (res.success) {
        router.refresh()
      } else {
        setError(res.error || 'اسم المستخدم أو كلمة المرور غير صحيحة')
        setLoading(false)
      }
    } catch {
      setError('تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#faf7f0' }} dir="rtl">
      <div className="w-full max-w-md bg-[#fffdf8] rounded-2xl p-8 sm:p-10 shadow-2xl border border-[#e2dcc9] relative overflow-hidden">
        {/* Subtle decorative top bar */}
        <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-l from-[#512300] via-[#8c4b18] to-[#512300]" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#f4f0e7] border-2 border-[#e2dcc9] mb-4 shadow-sm overflow-hidden p-1">
            <img src="/work/IMG_0154.jpeg" alt="ASIA AGENCY" className="w-full h-full object-contain rounded-full" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#512300]">لوحة التحكم</h1>
          <p className="text-sm text-[#79644f] mt-1">ASIA AGENCY — إدارة المحتوى والموقع</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5 text-right">
            <label className="text-sm font-semibold text-[#512300] block">اسم المستخدم</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#79644f]">
                <User size={18} />
              </span>
              <Input
                type="text"
                placeholder="اسم المستخدم (مثال: admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                className="pr-10 text-right bg-white border-[#e2dcc9] focus:border-[#512300] focus:ring-[#512300] h-12 text-base text-[#512300]"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-right">
            <label className="text-sm font-semibold text-[#512300] block">كلمة المرور</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#79644f]">
                <Lock size={18} />
              </span>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="pr-10 pl-10 text-right bg-white border-[#e2dcc9] focus:border-[#512300] focus:ring-[#512300] h-12 text-base text-[#512300]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#79644f] hover:text-[#512300] focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-right flex items-center gap-2">
              <span className="font-medium">{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-base font-semibold text-white transition-all shadow-md mt-2 cursor-pointer"
            style={{ backgroundColor: '#512300' }}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري التحقق...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={18} />
                دخول الداشبورد
              </span>
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#e2dcc9] text-center">
          <a
            href="/site"
            target="_blank"
            className="text-xs text-[#79644f] hover:text-[#512300] transition-colors underline inline-flex items-center gap-1"
          >
            زيارة الموقع العام (المعرض) ←
          </a>
        </div>
      </div>
    </main>
  )
}
