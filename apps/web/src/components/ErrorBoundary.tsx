import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  fallbackTitle?: string
}

type State = {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'Error inesperado' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Console logging for now; wire to observability service later
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white border rounded-2xl p-8 text-center shadow-sm">
            <p className="text-4xl mb-3">⚠️</p>
            <h1 className="text-xl font-semibold text-zinc-900">
              {this.props.fallbackTitle ?? 'Algo salió mal'}
            </h1>
            <p className="text-sm text-zinc-600 mt-2">
              Ocurrió un error en la interfaz. Puede reintentar o volver al inicio.
            </p>
            {this.state.message && (
              <p className="mt-3 text-xs font-mono bg-zinc-50 border rounded-lg p-2 text-zinc-500 break-all">
                {this.state.message}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-5 py-2.5 rounded-full bg-[#C8102E] text-white text-sm font-medium"
              >
                Reintentar
              </button>
              <a
                href={import.meta.env.BASE_URL || '/'}
                className="px-5 py-2.5 rounded-full border text-sm font-medium text-zinc-700"
              >
                Ir al inicio
              </a>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
