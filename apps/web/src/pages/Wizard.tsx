import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { SiteNav } from '@/components/SiteNav'
import { demoStore, type DemoApp } from '@/lib/demoStore'
import { catalog, getVar, resolvePoints, stepForField } from '@/lib/motor/catalog'
import { previewDiscard, runMotor } from '@/lib/motor/runMotor'
import type { AnswerInput, TipoPostulacion, ValidationError } from '@/lib/motor/types'
import listas from '@/lib/rules/listas_desplegables.json'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import {
  getApplication,
  getMyProfile,
  submitApplication,
  updateApplicationMeta,
  upsertAnswer,
  upsertIrl,
} from '@/lib/supabase/api'

const STEPS = ['Tipo y elegibilidad', 'Equipo', 'Modelo de negocio', 'Innovación', 'IRL', 'Revisión']

function validateStep(step: number, app: DemoApp, consentAt: string | null): ValidationError[] {
  const errors: ValidationError[] = []
  const answersMap = new Map(app.answers.map((a) => [a.variable_key, a]))

  const push = (code: string, field: string, message: string) => {
    errors.push({ code, field, message, step: stepForField(field) ?? step })
  }

  if (step === 0) {
    if (!app.tipo_postulacion) push('REQUIRED', 'tipo_postulacion', 'Seleccione tipo de postulación')
    if (app.anos_operacion_comercial == null || Number.isNaN(app.anos_operacion_comercial)) {
      push('REQUIRED', 'anos_operacion_comercial', 'Ingrese años de operación comercial')
    } else if (app.anos_operacion_comercial < 0) {
      push('INVALID_RANGE', 'anos_operacion_comercial', 'Los años no pueden ser negativos')
    }
    if (app.faculty_id == null) push('REQUIRED', 'faculty_id', 'Seleccione facultad / escuela')
    if (app.sector_id == null) push('REQUIRED', 'sector_id', 'Seleccione sector económico')
  }

  if (step === 1 || step === 2 || step === 3) {
    const block = step === 1 ? 'EQUIPO' : step === 2 ? 'MODELO' : 'INNOVACION'
    const innovPts = (() => {
      const v = getVar('innovacion')
      const a = answersMap.get('innovacion')
      if (!v || !a) return null
      return resolvePoints(v, a.value_option)
    })()
    const gradoRequired = innovPts != null && innovPts >= 3

    for (const v of catalog.variables.filter((x) => x.bloque === block)) {
      const a = answersMap.get(v.variable_key)
      const pts = a ? resolvePoints(v, a.value_option) : null
      if (v.variable_key === 'grado_innovacion') {
        if (gradoRequired && pts == null) {
          push(
            'GRADO_REQUIRED',
            'grado_innovacion',
            'Grado de innovación es obligatorio cuando hay innovación alta',
          )
        }
        continue
      }
      if (v.obligatorio && pts == null) {
        push('REQUIRED', v.variable_key, `Seleccione un nivel para ${v.variable_key.replace(/_/g, ' ')}`)
      }
    }
  }

  if (step === 4) {
    if (!app.tipo_postulacion) {
      push('REQUIRED', 'tipo_postulacion', 'Seleccione tipo de postulación primero')
    }
    // IRL levels default to range min in UI; justification is recommended (warnings only).
    // No hard block if dimensions not yet touched — user confirms on submit/review.
  }

  if (step === 5) {
    const result = runMotor({
      answers: app.answers,
      tipo_postulacion: app.tipo_postulacion,
      anos_operacion_comercial: app.anos_operacion_comercial,
      consent_at: consentAt,
    })
    if (!result.valid) errors.push(...result.validation_errors)
  }

  return errors
}

function stepCompleteness(
  step: number,
  app: DemoApp,
  consentAt: string | null,
): 'complete' | 'partial' | 'empty' {
  const errors = validateStep(step, app, consentAt)
  if (errors.length === 0) {
    if (step === 0) {
      if (!app.tipo_postulacion && app.anos_operacion_comercial == null && app.faculty_id == null)
        return 'empty'
      return 'complete'
    }
    return 'complete'
  }
  if (step === 0 && (app.tipo_postulacion || app.faculty_id || app.sector_id != null)) return 'partial'
  if (step >= 1 && step <= 3) {
    const block = step === 1 ? 'EQUIPO' : step === 2 ? 'MODELO' : 'INNOVACION'
    const keys = catalog.variables.filter((v) => v.bloque === block).map((v) => v.variable_key)
    if (app.answers.some((a) => keys.includes(a.variable_key))) return 'partial'
  }
  if (step === 4 && Object.keys(app.irl).length > 0) return 'partial'
  return 'empty'
}

export function Wizard() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const nav = useNavigate()
  const user = demoStore.getUser()
  const initial = !isSupabaseConfigured && id ? demoStore.getApp(id) : null
  const [app, setApp] = useState<DemoApp | null>(initial)
  const [loadingCloud, setLoadingCloud] = useState(isSupabaseConfigured)
  const [consentAt, setConsentAt] = useState<string | null>(user?.consent_at ?? null)
  const [step, setStep] = useState(() => {
    const s = searchParams.get('step')
    if (s != null && !Number.isNaN(Number(s))) return Math.min(Math.max(0, Number(s)), STEPS.length - 1)
    return 0
  })
  const [msg, setMsg] = useState('')
  const [stepErrors, setStepErrors] = useState<ValidationError[]>([])
  const [shakeField, setShakeField] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    if (!isSupabaseConfigured || !id) {
      setLoadingCloud(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const [profile, row] = await Promise.all([getMyProfile(), getApplication(id)])
        if (cancelled) return
        if (profile) {
          setConsentAt(profile.consent_at)
          demoStore.login(profile.email)
        }
        if (!row) {
          setApp(null)
          return
        }
        setApp({
          id: row.id,
          status: row.status,
          tipo_postulacion: row.tipo_postulacion,
          anos_operacion_comercial: row.anos_operacion_comercial,
          faculty_id: row.faculty_id,
          sector_id: row.sector_id,
          answers: row.answers,
          irl: row.irl,
          result: row.result,
          created_at: row.created_at,
          user_email: row.user_email ?? profile?.email ?? '',
        })
      } catch (e) {
        if (!cancelled) setMsg(e instanceof Error ? e.message : 'Error cargando postulación')
      } finally {
        if (!cancelled) setLoadingCloud(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const discardPreview = useMemo(
    () =>
      app
        ? previewDiscard({
            answers: app.answers,
            tipo_postulacion: app.tipo_postulacion,
            anos_operacion_comercial: app.anos_operacion_comercial,
          })
        : [],
    [app],
  )

  useEffect(() => {
    const focus = searchParams.get('field')
    if (!focus) return
    requestAnimationFrame(() => {
      const el = fieldRefs.current[focus] ?? document.querySelector(`[data-field="${focus}"]`)
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setShakeField(focus)
        setTimeout(() => setShakeField(null), 600)
      }
    })
  }, [searchParams, step])

  if (!isSupabaseConfigured && !user) return <Navigate to="/auth/login" replace />
  if (loadingCloud) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <SiteNav />
        <div className="max-w-2xl mx-auto pt-28 px-4 text-sm text-zinc-500">Cargando postulación…</div>
      </div>
    )
  }
  if (!app) return <Navigate to="/app" replace />
  if (app.status !== 'draft') return <Navigate to={`/app/${app.id}/resultado`} replace />

  // Narrow for closures (TS loses control-flow types inside nested functions)
  const currentApp = app

  function persist(patch: Partial<DemoApp>) {
    if (isSupabaseConfigured) {
      const next = { ...currentApp, ...patch }
      setApp(next)
      void (async () => {
        try {
          const meta: Parameters<typeof updateApplicationMeta>[1] = {}
          if ('tipo_postulacion' in patch) meta.tipo_postulacion = patch.tipo_postulacion ?? null
          if ('anos_operacion_comercial' in patch)
            meta.anos_operacion_comercial = patch.anos_operacion_comercial ?? null
          if ('faculty_id' in patch) meta.faculty_id = patch.faculty_id ?? null
          if ('sector_id' in patch) meta.sector_id = patch.sector_id ?? null
          if (Object.keys(meta).length) await updateApplicationMeta(currentApp.id, meta)
        } catch (e) {
          setMsg(e instanceof Error ? e.message : 'Error al guardar')
        }
      })()
      return
    }
    const next = demoStore.updateApp(currentApp.id, patch)
    if (next) setApp({ ...next })
  }

  function setAnswer(key: string, value_option: string) {
    const next: AnswerInput[] = [
      ...currentApp.answers.filter((a) => a.variable_key !== key),
      { variable_key: key, value_option },
    ]
    if (isSupabaseConfigured) {
      setApp({ ...currentApp, answers: next })
      void upsertAnswer(currentApp.id, { variable_key: key, value_option }).catch((e) =>
        setMsg(e instanceof Error ? e.message : 'Error al guardar respuesta'),
      )
      return
    }
    persist({ answers: next })
  }

  function varsForBlock(block: string) {
    return catalog.variables.filter((v) => v.bloque === block)
  }

  function scrollToFirstError(errors: ValidationError[]) {
    const first = errors[0]
    if (!first) return
    const el =
      fieldRefs.current[first.field] ??
      (document.querySelector(`[data-field="${first.field}"]`) as HTMLElement | null)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setShakeField(first.field)
      setTimeout(() => setShakeField(null), 600)
    }
  }

  function tryNext() {
    const errors = validateStep(step, currentApp, consentAt)
    setStepErrors(errors)
    if (errors.length) {
      setMsg(errors.map((e) => e.message).join(' · '))
      scrollToFirstError(errors)
      return
    }
    setMsg('')
    setStepErrors([])
    setStep((s) => s + 1)
  }

  async function submit() {
    setMsg('')
    const errors = validateStep(5, currentApp, consentAt)
    if (errors.length) {
      setStepErrors(errors)
      setMsg(errors.map((e) => e.message).join(' · '))
      const targetStep = errors[0]?.step ?? 5
      if (targetStep !== 5) setStep(targetStep)
      scrollToFirstError(errors)
      return
    }
    if (isSupabaseConfigured) {
      setSubmitting(true)
      try {
        // Persist IRL before edge function
        await Promise.all(
          Object.entries(currentApp.irl).map(([code, v]) =>
            upsertIrl(currentApp.id, code, v.level, v.justification),
          ),
        )
        const data = await submitApplication(currentApp.id)
        if (data.error === 'validation_failed' || data.validation_errors) {
          const ve = (data.validation_errors as ValidationError[]) ?? []
          setStepErrors(ve)
          setMsg(ve.map((e) => e.message ?? String(e)).join(' · ') || 'Validación fallida')
          return
        }
        if (data.error) {
          setMsg(String(data.error))
          return
        }
        nav(`/app/${currentApp.id}/resultado`)
      } catch (e) {
        setMsg(e instanceof Error ? e.message : 'Error al enviar')
      } finally {
        setSubmitting(false)
      }
      return
    }
    const result = demoStore.submit(currentApp.id)
    if (!result.valid) {
      setStepErrors(result.validation_errors)
      setMsg(result.validation_errors.map((e) => e.message).join(' · '))
      return
    }
    nav(`/app/${currentApp.id}/resultado`)
  }

  const answersMap = new Map(currentApp.answers.map((a) => [a.variable_key, a]))
  const innovPts = (() => {
    const v = getVar('innovacion')
    const a = answersMap.get('innovacion')
    if (!v || !a) return null
    return resolvePoints(v, a.value_option)
  })()
  const gradoRequired = innovPts != null && innovPts >= 3
  const errorFields = new Set(stepErrors.map((e) => e.field))

  function fieldClass(field: string) {
    const base = 'transition-all'
    if (errorFields.has(field) || shakeField === field) {
      return `${base} ring-2 ring-red-400 rounded-xl ${shakeField === field ? 'animate-pulse' : ''}`
    }
    return base
  }

  function bindField(field: string) {
    return {
      'data-field': field,
      ref: (el: HTMLElement | null) => {
        fieldRefs.current[field] = el
      },
      className: fieldClass(field),
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteNav />
      <div className="max-w-2xl mx-auto pt-28 px-4 pb-24">
        <p className="text-xs text-zinc-500 mb-2">
          Paso {step + 1} de {STEPS.length} · {STEPS[step]}
        </p>

        <div className="flex gap-1 mb-2">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              title={label}
              onClick={() => {
                if (i < step) setStep(i)
              }}
              className={`flex-1 h-1.5 rounded-full ${
                i === step ? 'ring-1 ring-[#C8102E]' : ''
              } ${i <= step ? 'bg-[#C8102E]/60' : 'bg-zinc-200'}`}
            >
              <span className="sr-only">{label}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-6 text-[10px] text-zinc-500">
          {STEPS.map((label, i) => {
            const state = stepCompleteness(i, currentApp, consentAt)
            const icon = state === 'complete' ? '✅' : state === 'partial' ? '🟡' : '⬜'
            return (
              <span
                key={label}
                className={`px-1.5 py-0.5 rounded ${i === step ? 'bg-zinc-200 text-zinc-800' : ''}`}
              >
                {icon} {i + 1}
              </span>
            )
          })}
        </div>

        <h1 className="text-xl font-semibold mb-6">{STEPS[step]}</h1>

        {discardPreview.length > 0 && step < 5 && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
            <p className="font-semibold">⚠ Advertencia de elegibilidad</p>
            <p className="mt-1 text-amber-800">
              Con los datos actuales, la postulación sería descartada al enviar:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {discardPreview.map((f) => (
                <li key={f.id}>
                  <span className="font-mono text-xs">{f.id}</span> — {f.label}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-amber-700">Puede continuar y corregir antes de enviar.</p>
          </div>
        )}

        {stepErrors.length > 0 && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-800">
            <p className="font-semibold">Complete los campos obligatorios</p>
            <ul className="mt-1 list-disc pl-5">
              {stepErrors.map((e) => (
                <li key={`${e.field}-${e.code}`}>{e.message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white border rounded-2xl p-6 space-y-5">
          {step === 0 && (
            <>
              <div {...bindField('tipo_postulacion')}>
                <Select
                  label="Tipo de postulación"
                  value={currentApp.tipo_postulacion ?? ''}
                  onChange={(v) => persist({ tipo_postulacion: v as TipoPostulacion })}
                  options={[
                    ['desarrollo_tecnologico', 'Desarrollo tecnológico / resultado de investigación'],
                    ['desarrollo_tecnologico_salud', 'Desarrollo tecnológico sector salud'],
                    ['adaptacion_tecnologica', 'Adaptación tecnológica'],
                  ]}
                />
              </div>
              <div {...bindField('anos_operacion_comercial')}>
                <label className="block text-sm">
                  <span className="font-medium">Años de operación comercial</span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    className="mt-1 w-full border rounded-xl px-3 py-2"
                    value={currentApp.anos_operacion_comercial ?? ''}
                    onChange={(e) =>
                      persist({
                        anos_operacion_comercial:
                          e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                </label>
              </div>
              <div {...bindField('faculty_id')}>
                <Select
                  label="Facultad / Escuela"
                  value={String(currentApp.faculty_id ?? '')}
                  onChange={(v) => persist({ faculty_id: Number(v) })}
                  options={listas.facultades_escuelas.map(
                    (f) => [String(f.id), f.nombre] as [string, string],
                  )}
                />
              </div>
              <div {...bindField('sector_id')}>
                <Select
                  label="Sector económico"
                  value={String(currentApp.sector_id ?? '')}
                  onChange={(v) => persist({ sector_id: Number(v) })}
                  options={listas.sectores_economicos.map(
                    (s) => [String(s.id), s.nombre] as [string, string],
                  )}
                />
              </div>
            </>
          )}

          {step === 1 &&
            varsForBlock('EQUIPO').map((v) => (
              <div key={v.variable_key} {...bindField(v.variable_key)}>
                <LevelField
                  label={v.variable_key.replace(/_/g, ' ')}
                  value={answersMap.get(v.variable_key)?.value_option ?? ''}
                  levels={v.niveles}
                  onChange={(lab) => setAnswer(v.variable_key, lab)}
                  required={v.obligatorio}
                />
              </div>
            ))}

          {step === 2 &&
            varsForBlock('MODELO').map((v) => (
              <div key={v.variable_key} {...bindField(v.variable_key)}>
                <LevelField
                  label={v.variable_key.replace(/_/g, ' ')}
                  value={answersMap.get(v.variable_key)?.value_option ?? ''}
                  levels={v.niveles}
                  onChange={(lab) => setAnswer(v.variable_key, lab)}
                  required={v.obligatorio}
                />
              </div>
            ))}

          {step === 3 &&
            varsForBlock('INNOVACION').map((v) => (
              <div key={v.variable_key} {...bindField(v.variable_key)}>
                <LevelField
                  label={v.variable_key.replace(/_/g, ' ')}
                  value={answersMap.get(v.variable_key)?.value_option ?? ''}
                  levels={v.niveles}
                  onChange={(lab) => setAnswer(v.variable_key, lab)}
                  required={v.obligatorio || (v.variable_key === 'grado_innovacion' && gradoRequired)}
                />
              </div>
            ))}

          {step === 4 && (
            <IrlStep
              tipo={currentApp.tipo_postulacion}
              irl={currentApp.irl}
              errorFields={errorFields}
              onChange={(code, level, justification) => {
                const irl = { ...currentApp.irl, [code]: { level, justification } }
                if (isSupabaseConfigured) {
                  setApp({ ...currentApp, irl })
                  void upsertIrl(currentApp.id, code, level, justification).catch((e) =>
                    setMsg(e instanceof Error ? e.message : 'Error al guardar IRL'),
                  )
                  return
                }
                persist({ irl })
              }}
            />
          )}

          {step === 5 && (
            <div className="text-sm space-y-3">
              <p>
                <strong>Tipo:</strong> {currentApp.tipo_postulacion ?? '—'}
              </p>
              <p>
                <strong>Años operación:</strong> {currentApp.anos_operacion_comercial ?? '—'}
              </p>
              <p>
                <strong>Respuestas con nivel:</strong> {currentApp.answers.length}
              </p>
              {discardPreview.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900">
                  <p className="font-medium">Se aplicarán reglas de descarte:</p>
                  <ul className="list-disc pl-5 mt-1">
                    {discardPreview.map((f) => (
                      <li key={f.id}>{f.label}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-zinc-500">
                Al enviar se aplicará descarte → score → IRL (motor_v1.1). El puntaje no lo calcula la
                IA.
              </p>
              {msg && <p className="text-red-600 text-sm">{msg}</p>}
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submit()}
                className="w-full bg-[#C8102E] text-white py-3 rounded-full font-medium disabled:opacity-60"
              >
                {submitting ? 'Enviando…' : 'Enviar postulación'}
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => {
              setStepErrors([])
              setMsg('')
              setStep((s) => s - 1)
            }}
            className="text-sm px-4 py-2 rounded-full border disabled:opacity-40"
          >
            Atrás
          </button>
          {step < STEPS.length - 1 && (
            <button
              type="button"
              onClick={tryNext}
              className="text-sm px-5 py-2 rounded-full bg-zinc-900 text-white"
            >
              Siguiente
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-400 mt-4">
          <Link to="/app" className="underline">
            Volver al panel
          </Link>
          · {isSupabaseConfigured ? 'Autoguardado Supabase' : 'Autoguardado local'}
        </p>
      </div>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: [string, string][]
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium capitalize">{label}</span>
      <select
        className="mt-1 w-full border rounded-xl px-3 py-2.5 bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Seleccione…</option>
        {options.map(([val, lab]) => (
          <option key={val} value={val}>
            {lab}
          </option>
        ))}
      </select>
    </label>
  )
}

function LevelField({
  label,
  value,
  levels,
  onChange,
  required,
}: {
  label: string
  value: string
  levels: { label: string; points: number }[]
  onChange: (label: string) => void
  required?: boolean
}) {
  return (
    <fieldset className="border-b border-zinc-100 pb-4">
      <legend className="text-sm font-medium capitalize mb-2">
        {label}{' '}
        {required ? (
          <span className="text-red-500">*</span>
        ) : (
          <span className="text-zinc-400">(opcional)</span>
        )}
      </legend>
      <div className="space-y-1.5">
        {levels.map((n) => (
          <label key={n.label} className="flex gap-2 text-sm items-start">
            <input
              type="radio"
              checked={value === n.label}
              onChange={() => onChange(n.label)}
              className="mt-1"
            />
            <span>
              {n.label} <span className="text-zinc-400">({n.points} pts)</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function IrlStep({
  tipo,
  irl,
  onChange,
  errorFields,
}: {
  tipo: TipoPostulacion | null
  irl: Record<string, { level: number; justification: string }>
  onChange: (code: string, level: number, justification: string) => void
  errorFields: Set<string>
}) {
  const dims = tipo ? (catalog.irl_by_tipo[tipo] ?? []) : []
  if (!tipo)
    return <p className="text-sm text-amber-700">Seleccione tipo de postulación en el paso 1.</p>
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">Dimensiones aplicables: {dims.join(', ')}</p>
      <p className="text-xs text-zinc-500">
        La justificación es recomendada; el nivel es obligatorio por dimensión.
      </p>
      {dims.map((code) => {
        const range = catalog.irl_ranges[code] ?? { min: 1, max: 5 }
        const cur = irl[code] ?? { level: range.min, justification: '' }
        const hasErr = errorFields.has(`irl_${code}`)
        return (
          <div
            key={code}
            data-field={`irl_${code}`}
            className={`border rounded-xl p-4 ${hasErr ? 'ring-2 ring-red-400' : ''}`}
          >
            <div className="flex justify-between text-sm font-medium mb-2">
              <span>{code}</span>
              <span>
                Nivel {cur.level} / {range.max}
              </span>
            </div>
            <input
              type="range"
              min={range.min}
              max={range.max}
              value={cur.level}
              onChange={(e) => onChange(code, Number(e.target.value), cur.justification)}
              className="w-full"
            />
            <textarea
              placeholder="Justificación del nivel (recomendada)"
              className="mt-2 w-full border rounded-lg text-sm p-2"
              rows={2}
              value={cur.justification}
              onChange={(e) => onChange(code, cur.level, e.target.value)}
            />
          </div>
        )
      })}
    </div>
  )
}
