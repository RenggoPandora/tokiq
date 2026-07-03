import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ShoppingCart, CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/verify-email')({
  component: VerifyEmailPage,
})

type VerifyState = 'checking' | 'success' | 'error' | 'pending'

function VerifyEmailPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<VerifyState>('checking')
  const [error, setError] = useState('')

  useEffect(() => {
    // Supabase mengirim token di URL hash setelah user klik link verifikasi
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setState('success')
        // Redirect ke onboarding setelah 2 detik
        setTimeout(() => navigate({ to: '/onboarding' }), 2000)
      } else if (event === 'USER_UPDATED') {
        setState('success')
        setTimeout(() => navigate({ to: '/app/dashboard' }), 2000)
      }
    })

    // Cek apakah ada error di URL hash
    const hash = window.location.hash
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1))
      setError(params.get('error_description') ?? 'Link verifikasi tidak valid atau sudah kadaluarsa.')
      setState('error')
    } else if (!hash.includes('access_token')) {
      // Tidak ada token — tampilkan halaman "cek email"
      setState('pending')
    }

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [navigate])

  async function handleResend() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    })

    if (!resendError) {
      // feedback sudah terkirim via toast (handled di parent)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg tracking-tight">tokiq</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {state === 'checking' && 'Memverifikasi...'}
              {state === 'pending' && 'Cek Email Kamu'}
              {state === 'success' && 'Email Terverifikasi!'}
              {state === 'error' && 'Verifikasi Gagal'}
            </CardTitle>
            <CardDescription>
              {state === 'pending' && 'Kami telah mengirim link verifikasi ke emailmu.'}
              {state === 'success' && 'Mengalihkan ke onboarding...'}
              {state === 'error' && 'Terjadi masalah saat verifikasi emailmu.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 py-4">
              {state === 'checking' && (
                <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
              )}

              {state === 'pending' && (
                <>
                  <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center">
                    <Mail className="w-7 h-7 text-foreground" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Klik link di email untuk mengaktifkan akunmu.
                      Cek juga folder <strong>Spam</strong> atau <strong>Promotions</strong>.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleResend}>
                    Kirim ulang email
                  </Button>
                </>
              )}

              {state === 'success' && (
                <>
                  <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Akunmu sudah aktif. Sedang mengalihkan ke setup toko...
                  </p>
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </>
              )}

              {state === 'error' && (
                <>
                  <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center">
                    <XCircle className="w-7 h-7 text-destructive" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">{error}</p>
                  <div className="flex gap-2">
                    <Link to="/register">
                      <Button variant="outline" size="sm">Daftar ulang</Button>
                    </Link>
                    <Button size="sm" onClick={handleResend}>
                      Kirim ulang email
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/login" className="hover:text-foreground transition-colors">
            ← Kembali ke login
          </Link>
        </p>
      </div>
    </div>
  )
}
