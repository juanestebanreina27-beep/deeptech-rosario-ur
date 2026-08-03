import { SiteNav } from '@/components/SiteNav'
import { HeroSpotlight } from '@/components/HeroSpotlight'
import { Link } from 'react-router-dom'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { logos } from '@/lib/assets'
import { CheckCircle2, FlaskConical, LineChart, Shield } from 'lucide-react'

const PILLARS = [
  {
    icon: Shield,
    title: 'Elegibilidad clara',
    body: 'Filtros de entrada transparentes antes del score. Sabes si aplicas sin perder tiempo.',
  },
  {
    icon: LineChart,
    title: 'Score trazable',
    body: 'Tres bloques con pesos del programa. Sin caja negra: cada punto se explica.',
  },
  {
    icon: FlaskConical,
    title: 'Madurez IRL',
    body: 'Diagnóstico condicional (salud + RRL). Adaptación KTH sin inventar TRL.',
  },
] as const

export function Home() {
  return (
    <div className="min-h-screen bg-white tracking-[-0.02em]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <SiteNav dark />
      <HeroSpotlight />

      {/* Franja institucional */}
      <section className="border-b border-zinc-100 bg-zinc-50">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={logos.red()} alt="" className="h-8 w-auto object-contain hidden sm:block" aria-hidden />
            <p className="text-sm text-zinc-600 text-center sm:text-left">
              <span className="font-semibold text-zinc-900">Universidad del Rosario</span>
              <span className="text-zinc-400 mx-2">·</span>
              Programa de selección y diagnóstico de transferencia tecnológica
            </p>
          </div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#C8102E] font-semibold">Desde 1653</p>
        </div>
      </section>

      {/* Pilares */}
      <section className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C8102E] mb-3">
            Cómo evaluamos
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900 tracking-tight">
            Rigor académico, claridad de proceso
          </h2>
          <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
            Una experiencia pensada para investigadores e innovadores de la Universidad del Rosario: seriedad
            institucional con una interfaz moderna.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-[#C8102E]/25 transition-all"
            >
              <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-[#C8102E] to-transparent opacity-80 rounded-full" />
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#C8102E]/8 text-[#C8102E]">
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">{title}</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bloque CTA institucional */}
      <section className="relative overflow-hidden bg-[#0c0c0c] text-white">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full opacity-[0.07]"
          style={{
            backgroundImage: `url(${logos.verticalWhite()})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}
          aria-hidden
        />
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20 grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <img
              src={logos.menWhite()}
              alt="Universidad del Rosario — Vigilada Mineducación"
              className="h-14 sm:h-16 w-auto object-contain object-left mb-8"
            />
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
              DeepTech con sello Rosario
            </h2>
            <p className="text-white/70 text-sm leading-relaxed max-w-lg mb-6">
              Selección y diagnóstico de transferencia tecnológica de la Universidad del Rosario. El informe con IA es
              opcional y <strong className="text-white/90 font-medium">no asigna el puntaje</strong>: el motor de
              evaluación es trazable y versionado.
            </p>
            <ul className="space-y-2.5 mb-8">
              {[
                'Postulación guiada por bloques del programa',
                'Resultado con descarte o score 0–100 desglosado',
                'Radar de madurez IRL cuando aplica',
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-white/80">
                  <CheckCircle2 className="text-[#C8102E] shrink-0 mt-0.5" size={16} />
                  {line}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/auth/registro"
                className="inline-flex items-center justify-center bg-[#C8102E] hover:bg-[#9a0c24] px-8 py-3 rounded-full text-sm font-semibold transition-colors shadow-lg shadow-[#C8102E]/25"
              >
                Inscribirse
              </Link>
              <Link
                to="/metodologia"
                className="inline-flex items-center justify-center border border-white/25 hover:bg-white/10 px-8 py-3 rounded-full text-sm font-medium transition-colors"
              >
                Ver metodología
              </Link>
            </div>
            {!isSupabaseConfigured && (
              <p className="mt-5 text-amber-300/90 text-xs">
                Backend Supabase no configurado: la app corre en <strong>modo demo</strong> (localStorage + motor local).
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 mb-4">Identidad del programa</p>
            <img src={logos.white()} alt="Universidad del Rosario" className="h-12 sm:h-14 w-auto object-contain mb-6" />
            <div className="h-px w-full bg-gradient-to-r from-[#C8102E] via-white/20 to-transparent mb-5" />
            <p className="text-sm text-white/70 leading-relaxed">
              Ciencia, rigor y vocación de impacto. DeepTech Rosario traduce la excelencia investigativa de la
              Universidad del Rosario en un proceso de selección claro, justo y profesional.
            </p>
            <p className="mt-5 text-xs text-white/40">
              Rojo institucional <span className="text-[#C8102E] font-mono">#C8102E</span>
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-3">
            <img src={logos.red()} alt="Universidad del Rosario" className="h-10 w-auto object-contain" />
            <p className="text-xs text-zinc-500 text-center md:text-left max-w-sm">
              © {new Date().getFullYear()} Universidad del Rosario · DeepTech Rosario · Todos los derechos reservados
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500">
            <Link to="/faq" className="hover:text-[#C8102E] underline-offset-2 hover:underline">
              Privacidad y FAQ
            </Link>
            <Link to="/metodologia" className="hover:text-[#C8102E] underline-offset-2 hover:underline">
              Metodología
            </Link>
            <Link to="/elegibilidad" className="hover:text-[#C8102E] underline-offset-2 hover:underline">
              Elegibilidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
