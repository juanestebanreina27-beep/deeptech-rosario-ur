import { SiteNav } from '@/components/SiteNav'
import { HeroSpotlight } from '@/components/HeroSpotlight'
import { Link } from 'react-router-dom'
import { isSupabaseConfigured } from '@/lib/supabase/client'

export function Home() {
  return (
    <div className="min-h-screen bg-white tracking-[-0.02em]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <SiteNav dark />
      <HeroSpotlight />
      <section className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
        {[
          ['Elegibilidad clara', 'Filtros de entrada transparentes antes del score.'],
          ['Score trazable', 'Tres bloques con pesos del programa. Sin caja negra.'],
          ['Madurez IRL', 'Diagnóstico condicional (salud + RRL, adaptación sin TRL).'],
        ].map(([t, d]) => (
          <div key={t} className="rounded-2xl border border-zinc-200 p-6 bg-zinc-50">
            <h3 className="font-semibold text-zinc-900 mb-2">{t}</h3>
            <p className="text-sm text-zinc-600">{d}</p>
          </div>
        ))}
      </section>
      <section className="bg-zinc-900 text-white py-14 px-6 text-center">
        <h2 className="text-2xl font-semibold mb-3">DeepTech Rosario</h2>
        <p className="text-white/70 max-w-xl mx-auto text-sm mb-6">
          Programa de selección y diagnóstico de transferencia tecnológica · Universidad del Rosario.
          El informe con IA es opcional y no asigna el puntaje.
        </p>
        <Link to="/auth/registro" className="inline-block bg-[#C8102E] px-8 py-3 rounded-full text-sm font-medium">
          Inscribirse
        </Link>
        {!isSupabaseConfigured && (
          <p className="mt-4 text-amber-300/90 text-xs">
            Backend Supabase no configurado: la app corre en <strong>modo demo</strong> (localStorage + motor local).
          </p>
        )}
      </section>
      <footer className="py-8 text-center text-xs text-zinc-500 border-t">
        © {new Date().getFullYear()} Universidad del Rosario · DeepTech Rosario ·{' '}
        <Link to="/faq" className="underline">Privacidad y FAQ</Link>
      </footer>
    </div>
  )
}
