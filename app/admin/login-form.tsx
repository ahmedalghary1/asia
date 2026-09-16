'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await loginAction(password)
    
    if (res.success) {
      router.refresh()
    } else {
      setError(res.error || 'حدث خطأ غير متوقع')
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4" dir="rtl">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6 rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-xl">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">تسجيل الدخول</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">أدخل كلمة المرور الخاصة بلوحة التحكم</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Input 
              type="password" 
              placeholder="كلمة المرور" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="text-right"
            />
          </div>
          
          {error && <p className="text-sm text-red-500 text-right">{error}</p>}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'جاري التحقق...' : 'دخول'}
          </Button>
        </div>
      </form>
    </main>
  )
}
