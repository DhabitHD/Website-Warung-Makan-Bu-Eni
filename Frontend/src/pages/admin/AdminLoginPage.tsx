import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, LogIn } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/login'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { loginAdmin } from '@/features/auth/services/auth.service'

/** Login pemilik warung — Fase 2 (MILIK LEAD). Data login masih mock. */
export function AdminLoginPage() {
  const admin = useAuthStore((state) => state.admin)
  const masuk = useAuthStore((state) => state.masuk)
  const navigate = useNavigate()
  const [galat, setGalat] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  // Sudah login → langsung ke dashboard.
  if (admin) {
    return <Navigate to="/admin" replace />
  }

  const onSubmit = async (values: LoginFormValues) => {
    setGalat(null)
    try {
      const sesi = await loginAdmin(values.username, values.password)
      masuk(sesi)
      navigate('/admin', { replace: true })
    } catch (error) {
      setGalat(error instanceof Error ? error.message : 'Login gagal. Coba lagi.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="font-display text-2xl font-semibold text-brand">
            Warung Makan <span className="font-medium text-accent italic">Bu Eni</span>
          </p>
          <p className="mt-1 text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Dashboard admin
          </p>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 rounded-xl border border-border bg-surface p-6 shadow-card"
        >
          <h1 className="font-display text-2xl font-medium text-ink">Login admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masuk untuk mengelola menu dan pesanan warung.
          </p>

          {galat && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {galat}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                aria-invalid={Boolean(errors.username)}
                {...register('username')}
              />
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-accent mt-6 w-full">
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogIn className="size-4" aria-hidden="true" />
            )}
            {isSubmitting ? 'Memeriksa…' : 'Masuk'}
          </button>

          <p className="mt-4 rounded-lg bg-secondary px-3 py-2 text-center text-xs text-muted-foreground">
            Akun demo: <span className="font-semibold text-ink">admin</span> /{' '}
            <span className="font-semibold text-ink">eni123</span>
          </p>
        </form>
      </div>
    </div>
  )
}
