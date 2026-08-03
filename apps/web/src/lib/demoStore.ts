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
const SCHEMA_VERSION = 2

type Store = {
  schema_version: number
  user: { email: string; name: string; role: string; consent_at: string | null } | null
  apps: DemoApp[]
}

function emptyStore(): Store {
  return { schema_version: SCHEMA_VERSION, user: null, apps: [] }
}

function isValidStore(raw: unknown): raw is Store {
  if (!raw || typeof raw !== 'object') return false
  const s = raw as Record<string, unknown>
  if (!Array.isArray(s.apps)) return false
  if (s.user !== null && typeof s.user !== 'object') return false
  return true
}

function normalizeApp(a: Partial<DemoApp> & { id: string }): DemoApp {
  return {
    id: a.id,
    status: a.status ?? 'draft',
    tipo_postulacion: a.tipo_postulacion ?? null,
    anos_operacion_comercial: a.anos_operacion_comercial ?? null,
    faculty_id: a.faculty_id ?? null,
    sector_id: a.sector_id ?? null,
    answers: Array.isArray(a.answers) ? a.answers : [],
    irl: a.irl && typeof a.irl === 'object' ? a.irl : {},
    result: a.result ?? null,
    created_at: a.created_at ?? new Date().toISOString(),
    user_email: a.user_email ?? '',
  }
}

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyStore()
    const parsed: unknown = JSON.parse(raw)
    if (!isValidStore(parsed)) {
      console.warn('[demoStore] invalid schema — resetting')
      return emptyStore()
    }
    // Migrate / normalize
    const store: Store = {
      schema_version: SCHEMA_VERSION,
      user: parsed.user ?? null,
      apps: (parsed.apps as Partial<DemoApp>[]).map((a) =>
        normalizeApp(a as Partial<DemoApp> & { id: string }),
      ),
    }
    // Best-effort: strip incompatible MotorResult shapes from old schema
    for (const app of store.apps) {
      if (app.result && !Array.isArray(app.result.validation_errors)) {
        app.result = null
        if (app.status === 'scored' || app.status === 'discarded') app.status = 'draft'
      } else if (app.result && typeof app.result.validation_errors[0] === 'string') {
        // Old string[] validation_errors — clear to avoid runtime crashes
        app.result = null
        if (app.status === 'scored' || app.status === 'discarded') app.status = 'draft'
      }
      if (app.result && !Array.isArray(app.result.warnings)) {
        app.result.warnings = []
      }
    }
    return store
  } catch (e) {
    console.error('[demoStore] load failed', e)
    return emptyStore()
  }
}

function save(s: Store) {
  try {
    s.schema_version = SCHEMA_VERSION
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch (e) {
    console.error('[demoStore] save failed (quota?)', e)
  }
}

export const demoStore = {
  getUser() {
    return load().user
  },
  reset() {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
    return emptyStore()
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
  /** Reopen discarded/scored app as draft so the user can correct fields */
  reopenDraft(id: string): DemoApp | null {
    const s = load()
    const i = s.apps.findIndex((a) => a.id === id)
    if (i < 0) return null
    s.apps[i] = { ...s.apps[i], status: 'draft' }
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
    try {
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
    } catch (e) {
      console.error('[demoStore] submit motor error', e)
      throw e
    }
  },
}
