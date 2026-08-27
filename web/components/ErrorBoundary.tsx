'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: unknown
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error }
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('Route crashed:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <RouteErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}

function RouteErrorFallback({ error }: { error?: unknown }) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white rounded-[24px] border border-red-100">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-[20px]">⚠️</div>
      <h3 className="font-bold text-[16px]">Something went wrong</h3>
      <p className="text-[13px] text-black/60 mt-2 max-w-[400px]">
        This section crashed. Our team has been notified. Try refreshing or go back to home.
      </p>
      <div className="flex gap-2 mt-4">
        <button onClick={() => window.location.reload()} className="h-9 px-4 bg-black text-white rounded-full text-[13px] font-bold">Reload</button>
        <button onClick={() => window.location.href = '/'} className="h-9 px-4 bg-[#F5F5F7] rounded-full text-[13px] font-bold">Go Home</button>
      </div>
      {process.env.NODE_ENV === 'development' && error ? (
        <pre className="mt-4 text-[11px] bg-[#F5F5F7] p-3 rounded-xl overflow-auto max-w-full text-left">{String(error as any)}</pre>
      ) : null}
    </div>
  )
}

export function RouteErrorFallbackSimple() {
  return <RouteErrorFallback />
}
