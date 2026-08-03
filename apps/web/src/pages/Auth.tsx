import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SiteNav } from '@/components/SiteNav'
import { demoStore } from '@/lib/demoStore'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'

export function AuthRegistro() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [consent, setConsent] = useState(false)
  const [veraz, setVeraz] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (!consent) {
      setErr('Debe autorizar el tratamiento de datos.')
      return
    }
    if (!veraz) {
      setErr('Debe declarar la veracidad de la información.')
      return
    }
    setLoading(true)
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        })
        if (error) throw error
        await supabase.from('profiles').update({
          full_name: name,
          consent_at: new Date().toISOString(),
          privacy_version: 'ur-deeptech-v1',
        }).eq('email', email)
      }
      demoStore.register(email, name, true)
      nav('/app')
    } catch (ex: unknown) {
      const msg = ex instanceof Error ? ex.message : 'Error de registro'
      // still allow demo
      demoStore.register(email, name, true)
      if (isSupabaseConfigured) setErr(msg + ' — sesión demo local activada.')
      else nav('/app')
      if (!isSupabaseConfigured) nav('/app')
      else nav('/app')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Inscribirse">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Nombre completo" value={name} onChange={setName} required />
        <Field label="Correo" type="email" value={email} onChange={setEmail} required />
        <Field label="Contraseña" type="password" value={password} onChange={setPassword} required />
        <label className="flex gap-2 text-sm text-zinc-700 items-start">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
          <span>
            Autorizo el tratamiento de mis datos personales por la Universidad del Rosario para la postulación y
            evaluación del programa DeepTech Rosario (Ley 1581 de 2012).
          </span>
        </label>
        <label className="flex gap-2 text-sm text-zinc-700 items-start">
          <input type="checkbox" checked={veraz} onChange={(e) => setVeraz(e.target.checked)} className="mt-1" />
          <span>Declaro que la información que suministraré es veraz y completa.</span>
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#C8102E] hover:bg-[#9a0c24] text-white py-3 rounded-full font-medium text-sm"
        >
          {loading ? 'Creando cuenta…' : 'Crear cuenta y continuar'}
        </button>
        <p className="text-center text-sm text-zinc-500">
          ¿Ya tienes cuenta? <Link to="/auth/login" className="text-[#C8102E]">Ingresar</Link>
        </p>
      </form>
    </AuthShell>
  )
}

export function AuthLogin() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
      demoStore.login(email)
      nav('/app')
    } catch (ex: unknown) {
      demoStore.login(email)
      nav('/app')
      if (ex instanceof Error) setErr(ex.message)
    }
  }

  return (
    <AuthShell title="Ingresar">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Correo" type="email" value={email} onChange={setEmail} required />
        <Field label="Contraseña" type="password" value={password} onChange={setPassword} required />
        {err && <p className="text-sm text-amber-700">{err} (modo demo si falla Supabase)</p>}
        <button type="submit" className="w-full bg-[#C8102E] text-white py-3 rounded-full font-medium text-sm">
          Ingresar
        </button>
        <p className="text-center text-sm text-zinc-500">
          Tip admin demo: usa un correo que contenga <code>admin</code>
        </p>
      </form>
    </AuthShell>
  )
}

function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteNav />
      <div className="max-w-md mx-auto pt-28 px-4 pb-16">
        <h1 className="text-2xl font-semibold mb-2">{title}</h1>
        <p className="text-sm text-zinc-500 mb-8">DeepTech Rosario · Universidad del Rosario</p>
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">{children}</div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="block text-sm">
      <span className="text-zinc-700 font-medium">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-zinc-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30"
      />
    </label>
  )
}
