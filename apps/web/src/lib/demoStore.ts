/**
 * Local demo store when Supabase is not configured.
 * Allows full motor UX offline; production uses Supabase.
 */
import { runMotor, type MotorInput, type MotorResult } from './motor/runMotor'
import type { AnswerInput, TipoPostulacion } from './motor/types'

export type DemoApp = {
  id: string
  status: string
  tipo_postulacion: TipoPostulacion | null
  anos_operacion_comercial: number | null
  faculty_id: number | null
  sector_id: number | null
  answers: AnswerInput[]
  irl: Record<string, { level: number; justification: string }>
  result: MotorResult | null
  created_at: string
  user_email: string
}

const KEY = 'deeptech_rosario_demo_v1'

type Store = {
  user: { email: string; name: string; role: string; consent_at: string | null } | null
  apps: DemoApp[]
}

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Store
  } catch {
    /* ignore */
  }
  return { user: null, apps: [] }
}

function save(s: Store) {
  localStorage.setItem(KEY, JSON.stringify(s))
}

export const demoStore = {
  getUser() {
    return load().user
  },
  register(email: string, name: string, consent: boolean) {
    const s = load()
    s.user = {
      email,
      name,
      role: email.includes('admin') ? 'admin' : 'postulante',
      consent_at: consent ? new Date().toISOString() : null,
    }
    save(s)
    return s.user
  },
  login(email: string) {
    const s = load()
    if (s.user?.email === email) return s.user
    s.user = {
      email,
      name: email.split('@')[0],
      role: email.includes('admin') ? 'admin' : 'postulante',
      consent_at: new Date().toISOString(),
    }
    save(s)
    return s.user
  },
  logout() {
    const s = load()
    s.user = null
    save(s)
  },
  listApps() {
    const s = load()
    if (!s.user) return []
    if (s.user.role === 'admin' || s.user.role === 'evaluador') return s.apps
    return s.apps.filter((a) => a.user_email === s.user!.email)
  },
  getApp(id: string) {
    return this.listApps().find((a) => a.id === id) ?? null
  },
  createApp() {
    const s = load()
    if (!s.user) throw new Error('No auth')
    const app: DemoApp = {
      id: crypto.randomUUID(),
      status: 'draft',
      tipo_postulacion: null,
      anos_operacion_comercial: null,
      faculty_id: null,
      sector_id: null,
      answers: [],
      irl: {},
      result: null,
      created_at: new Date().toISOString(),
      user_email: s.user.email,
    }
    s.apps.push(app)
    save(s)
    return app
  },
  updateApp(id: string, patch: Partial<DemoApp>) {
    const s = load()
    const i = s.apps.findIndex((a) => a.id === id)
    if (i < 0) return null
    s.apps[i] = { ...s.apps[i], ...patch }
    save(s)
    return s.apps[i]
  },
  submit(id: string): MotorResult {
    const s = load()
    const app = s.apps.find((a) => a.id === id)
    if (!app || !s.user) throw new Error('App not found')
    const input: MotorInput = {
      answers: app.answers,
      tipo_postulacion: app.tipo_postulacion,
      anos_operacion_comercial: app.anos_operacion_comercial,
      consent_at: s.user.consent_at,
    }
    const result = runMotor(input)
    if (!result.valid) {
      app.result = result
      save(s)
      return result
    }
    app.result = result
    app.status = result.discard.passed ? 'scored' : 'discarded'
    save(s)
    return result
  },
}
