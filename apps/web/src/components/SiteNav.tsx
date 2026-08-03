import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { demoStore } from '@/lib/demoStore'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'
import { logos } from '@/lib/assets'

const NAV_LINKS: [string, string][] = [
  ['/', 'Inicio'],
  ['/elegibilidad', '¿Apto?'],
  ['/metodologia', 'Metodología'],
  ['/faq', 'FAQ'],
]

export function SiteNav({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false)
  const user = demoStore.getUser()
  const text = dark ? 'text-white' : 'text-zinc-900'
  const muted = dark ? 'text-white/75' : 'text-zinc-600'

  async function logout() {
    demoStore.logout()
    if (supabase) await supabase.auth.signOut()
    window.location.href = import.meta.env.BASE_URL || '/'
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] ${
        dark
          ? 'bg-gradient-to-b from-black/70 via-black/35 to-transparent backdrop-blur-[2px]'
          : 'bg-white/95 backdrop-blur-md border-b border-zinc-100 shadow-sm'
      }`}
    >
      {/* Franja institucional roja UR */}
      <div className="h-[3px] w-full bg-[#C8102E]" aria-hidden />

      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-3.5">
        {/* Marca: logo oficial + producto secundario */}
        <Link to="/" className="flex items-center gap-3 min-w-0 group" aria-label="Universidad del Rosario — DeepTech">
          <img
            src={dark ? logos.white() : logos.red()}
            alt="Universidad del Rosario"
            className={`w-auto object-contain object-left shrink-0 drop-shadow-sm transition-opacity group-hover:opacity-95 ${
              dark ? 'h-9 sm:h-11 md:h-12' : 'h-8 sm:h-10 md:h-11'
            }`}
            style={dark ? { filter: 'drop-shadow(0 1px 8px rgba(0,0,0,0.45))' } : undefined}
          />
          <span
            className={`hidden sm:block w-px self-stretch my-1 shrink-0 ${dark ? 'bg-white/25' : 'bg-zinc-200'}`}
            aria-hidden
          />
          <div className="hidden sm:flex flex-col justify-center min-w-0 leading-tight">
            <span
              className={`text-[10px] font-medium uppercase tracking-[0.2em] ${
                dark ? 'text-white/55' : 'text-zinc-500'
              }`}
            >
              Convocatoria
            </span>
            <span className={`${text} text-sm sm:text-[15px] font-semibold tracking-tight`}>
              DeepTech <span className="text-[#C8102E] font-bold">Rosario</span>
            </span>
          </div>
        </Link>

        {/* Pill central */}
        <div
          className={`hidden lg:flex absolute left-1/2 -translate-x-1/2 rounded-full px-1.5 py-1.5 items-center gap-0.5 ${
            dark
              ? 'bg-white/12 backdrop-blur-md border border-white/25'
              : 'bg-zinc-100/90 border border-zinc-200/80'
          }`}
        >
          {NAV_LINKS.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? dark
                      ? 'text-white bg-white/20 shadow-sm'
                      : 'text-zinc-900 bg-white shadow-sm'
                    : `${muted} hover:text-inherit ${dark ? 'hover:bg-white/10' : 'hover:bg-white/80'}`
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Acciones desktop */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <Link to="/app" className={`${muted} text-sm font-medium px-2 hover:opacity-100`}>
                Mi panel
              </Link>
              {(user.role === 'admin' || user.role === 'evaluador') && (
                <Link to="/admin" className="text-sm text-[#C8102E] font-semibold px-2">
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={logout}
                className={`text-sm px-4 py-2 rounded-full border font-medium ${
                  dark ? 'border-white/35 text-white/90 hover:bg-white/10' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/auth/login" className={`${muted} text-sm font-medium px-3 hover:opacity-100`}>
                Ingresar
              </Link>
              <Link
                to="/auth/registro"
                className={
                  dark
                    ? 'bg-white text-[#1a1a1a] text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-zinc-100 transition-colors shadow-sm'
                    : 'bg-[#C8102E] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#9a0c24] transition-colors shadow-sm shadow-[#C8102E]/20'
                }
              >
                Inscribirse
              </Link>
            </>
          )}
        </div>

        <button type="button" className={`md:hidden p-1 ${text}`} onClick={() => setOpen(!open)} aria-label="Menú">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-zinc-950 text-white px-5 py-5 flex flex-col gap-1 shadow-2xl">
          <div className="mb-3 pb-3 border-b border-white/10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 mb-1">Universidad del Rosario</p>
            <p className="text-sm font-semibold">
              DeepTech <span className="text-[#C8102E]">Rosario</span>
            </p>
          </div>
          {NAV_LINKS.map(([to, label]) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="py-2.5 text-sm font-medium text-white/90 border-b border-white/5"
            >
              {label}
            </Link>
          ))}
          <Link to="/auth/registro" onClick={() => setOpen(false)} className="mt-3 text-center bg-[#C8102E] py-3 rounded-full text-sm font-semibold">
            Inscribirse
          </Link>
          <Link to="/auth/login" onClick={() => setOpen(false)} className="text-center py-2 text-sm text-white/70">
            Ingresar
          </Link>
          <Link to="/app" onClick={() => setOpen(false)} className="text-center py-2 text-sm text-white/70">
            Mi panel
          </Link>
          {!isSupabaseConfigured && (
            <p className="text-xs text-amber-300/90 mt-2 text-center">Modo demo local (sin Supabase)</p>
          )}
        </div>
      )}
    </nav>
  )
}
