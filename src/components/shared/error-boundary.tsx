import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Global error boundary — catches unhandled render errors and shows a fallback UI.
 * Wrap around route outlets or specific feature areas.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, send to error tracking (e.g. Sentry)
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-2">
            Terjadi kesalahan
          </h2>
          <p className="text-sm text-muted-foreground mb-1 max-w-sm">
            Halaman ini mengalami error yang tidak terduga.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <p className="text-xs text-destructive font-mono bg-destructive/10 rounded px-3 py-2 my-3 max-w-md text-left break-all">
              {this.state.error.message}
            </p>
          )}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={this.handleReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Coba Lagi
            </Button>
            <Button size="sm" onClick={() => window.location.assign('/')}>
              Ke Beranda
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Page-level error boundary — lighter wrapper for individual route pages.
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
