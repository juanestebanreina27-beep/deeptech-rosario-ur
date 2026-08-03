import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { demoStore } from '@/lib/demoStore'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'

export function SiteNav({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false)
  const user = demoStore.getUser()
  const text = dark ? 'text-white' : 'text-zinc-900'
  const muted = dark ? 'text-white/80' : 'text-zinc-600'

  async function logout() {
    demoStore.logout()
    if (supabase) await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-5 ${dark ? '' : 'bg-white/90 backdrop-blur border-b border-zinc-100'}`}>
      <Link to="/" className="flex items-center gap-2">
        {dark ? (
          <img src="/assets/logo-ur-white.png" alt="Universidad del Rosario" className="h-8 w-auto" />
        ) : (
          <span className="text-[#C8102E] font-semibold text-sm">Universidad del Rosario</span>
        )}
        <span className={`${text} text-xl font-playfair italic`}>DeepTech Rosario</span>
      </Link>

      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-2 py-2 items-center gap-1"
        style={dark ? undefined : { background: 'rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.08)' }}>
        {[
          ['/', 'Inicio'],
          ['/elegibilidad', '¿Apto?'],
          ['/metodologia', 'Metodología'],
          ['/faq', 'FAQ'],
        ].map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive ? (dark ? 'text-white bg-white/20' : 'text-zinc-900 bg-white shadow-sm') : `${muted} hover:bg-black/5`
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      <div className="hidden md:flex items-center gap-2">
        {user ? (
          <>
            <Link to="/app" className={dark ? 'text-white/90 text-sm' : 'text-zinc-700 text-sm'}>
              Mi panel
            </Link>
            {(user.role === 'admin' || user.role === 'evaluador') && (
              <Link to="/admin" className="text-sm text-[#C8102E] font-medium">Admin</Link>
            )}
            <button onClick={logout} className="text-sm px-4 py-2 rounded-full border border-current opacity-80">
              Salir
            </button>
          </>
        ) : (
          <>
            <Link to="/auth/login" className={`${muted} text-sm px-3`}>Ingresar</Link>
            <Link
              to="/auth/registro"
              className="bg-white text-gray-900 text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100"
            >
              Inscribirse
            </Link>
          </>
        )}
      </div>

      <button className={`md:hidden ${text}`} onClick={() => setOpen(!open)} aria-label="Menú">
        {open ? <X /> : <Menu />}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 bg-zinc-900 text-white p-4 flex flex-col gap-3 md:hidden">
          <Link to="/elegibilidad" onClick={() => setOpen(false)}>¿Apto?</Link>
          <Link to="/auth/registro" onClick={() => setOpen(false)}>Inscribirse</Link>
          <Link to="/auth/login" onClick={() => setOpen(false)}>Ingresar</Link>
          <Link to="/app" onClick={() => setOpen(false)}>Mi panel</Link>
          {!isSupabaseConfigured && (
            <p className="text-xs text-amber-300">Modo demo local (sin Supabase)</p>
          )}
        </div>
      )}
    </nav>
  )
}
