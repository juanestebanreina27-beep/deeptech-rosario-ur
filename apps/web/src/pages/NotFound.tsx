import { Link } from 'react-router-dom'
import { SiteNav } from '@/components/SiteNav'

export function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteNav />
      <div className="max-w-lg mx-auto pt-36 px-4 text-center">
        <p className="text-6xl font-semibold text-zinc-300">404</p>
        <h1 className="text-2xl font-semibold mt-4">Página no encontrada</h1>
        <p className="text-sm text-zinc-600 mt-2">
          La ruta que buscó no existe o fue movida. Vuelva al inicio o a su panel de postulaciones.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-8">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-full bg-[#C8102E] text-white text-sm font-medium"
          >
            Inicio
          </Link>
          <Link to="/app" className="px-5 py-2.5 rounded-full border text-sm font-medium">
            Mis postulaciones
          </Link>
        </div>
      </div>
    </div>
  )
}
