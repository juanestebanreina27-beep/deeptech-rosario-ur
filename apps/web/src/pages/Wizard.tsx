import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { SiteNav } from '@/components/SiteNav'
import { demoStore, type DemoApp } from '@/lib/demoStore'
import { catalog } from '@/lib/motor/catalog'
import type { AnswerInput, TipoPostulacion } from '@/lib/motor/types'
import listas from '@/lib/rules/listas_desplegables.json'

const STEPS = ['Tipo y elegibilidad', 'Equipo', 'Modelo de negocio', 'Innovación', 'IRL', 'Revisión']

export function Wizard() {
  const { id } = useParams()
  const nav = useNavigate()
  const user = demoStore.getUser()
  const initial = id ? demoStore.getApp(id) : null
  const [app, setApp] = useState<DemoApp | null>(initial)
  const [step, setStep] = useState(0)
  const [msg, setMsg] = useState('')

  if (!user) return <Navigate to="/auth/login" replace />
  if (!app) return <Navigate to="/app" replace />
  if (app.status !== 'draft' && app.status !== 'scored' && app.status !== 'discarded') {
    /* allow draft only for edit */
  }
  if (app.status !== 'draft') return <Navigate to={`/app/${app.id}/resultado`} replace />

  function persist(patch: Partial<DemoApp>) {
    const next = demoStore.updateApp(app!.id, patch)
    if (next) setApp({ ...next })
  }

  function setAnswer(key: string, value_option: string) {
    const next: AnswerInput[] = [
      ...app!.answers.filter((a) => a.variable_key !== key),
      { variable_key: key, value_option },
    ]
    persist({ answers: next })
  }

  function varsForBlock(block: string) {
    return catalog.variables.filter((v) => v.bloque === block)
  }

  function submit() {
    setMsg('')
    const result = demoStore.submit(app!.id)
    if (!result.valid) {
      setMsg(result.validation_errors.join(' · '))
      return
    }
    nav(`/app/${app!.id}/resultado`)
  }

  const answersMap = new Map(app.answers.map((a) => [a.variable_key, a]))
  const innovLabel = answersMap.get('innovacion')?.value_option ?? ''
  const gradoRequired = innovLabel.includes('Contiene') || innovLabel.includes('desarrolla')

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteNav />
      <div className="max-w-2xl mx-auto pt-28 px-4 pb-24">
        <p className="text-xs text-zinc-500 mb-2">
          Paso {step + 1} de {STEPS.length} · {STEPS[step]}
        </p>
        <div className="h-1.5 bg-zinc-200 rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-[#C8102E] transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <h1 className="text-xl font-semibold mb-6">{STEPS[step]}</h1>

        <div className="bg-white border rounded-2xl p-6 space-y-5">
          {step === 0 && (
            <>
              <Select
                label="Tipo de postulación"
                value={app.tipo_postulacion ?? ''}
                onChange={(v) => persist({ tipo_postulacion: v as TipoPostulacion })}
                options={[
                  ['desarrollo_tecnologico', 'Desarrollo tecnológico / resultado de investigación'],
                  ['desarrollo_tecnologico_salud', 'Desarrollo tecnológico sector salud'],
                  ['adaptacion_tecnologica', 'Adaptación tecnológica'],
                ]}
              />
              <label className="block text-sm">
                <span className="font-medium">Años de operación comercial</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  className="mt-1 w-full border rounded-xl px-3 py-2"
                  value={app.anos_operacion_comercial ?? ''}
                  onChange={(e) => persist({ anos_operacion_comercial: Number(e.target.value) })}
                />
              </label>
              <Select
                label="Facultad / Escuela"
                value={String(app.faculty_id ?? '')}
                onChange={(v) => persist({ faculty_id: Number(v) })}
                options={listas.facultades_escuelas.map((f) => [String(f.id), f.nombre] as [string, string])}
              />
              <Select
                label="Sector económico"
                value={String(app.sector_id ?? '')}
                onChange={(v) => persist({ sector_id: Number(v) })}
                options={listas.sectores_economicos.map((s) => [String(s.id), s.nombre] as [string, string])}
              />
            </>
          )}

          {step === 1 &&
            varsForBlock('EQUIPO').map((v) => (
              <LevelField
                key={v.variable_key}
                label={v.variable_key.replace(/_/g, ' ')}
                value={answersMap.get(v.variable_key)?.value_option ?? ''}
                levels={v.niveles}
                onChange={(lab) => setAnswer(v.variable_key, lab)}
                required={v.obligatorio}
              />
            ))}

          {step === 2 &&
            varsForBlock('MODELO').map((v) => (
              <LevelField
                key={v.variable_key}
                label={v.variable_key.replace(/_/g, ' ')}
                value={answersMap.get(v.variable_key)?.value_option ?? ''}
                levels={v.niveles}
                onChange={(lab) => setAnswer(v.variable_key, lab)}
                required={v.obligatorio}
              />
            ))}

          {step === 3 &&
            varsForBlock('INNOVACION').map((v) => (
              <LevelField
                key={v.variable_key}
                label={v.variable_key.replace(/_/g, ' ')}
                value={answersMap.get(v.variable_key)?.value_option ?? ''}
                levels={v.niveles}
                onChange={(lab) => setAnswer(v.variable_key, lab)}
                required={v.obligatorio || (v.variable_key === 'grado_innovacion' && gradoRequired)}
              />
            ))}

          {step === 4 && (
            <IrlStep
              tipo={app.tipo_postulacion}
              irl={app.irl}
              onChange={(code, level, justification) => {
                persist({ irl: { ...app.irl, [code]: { level, justification } } })
              }}
            />
          )}

          {step === 5 && (
            <div className="text-sm space-y-3">
              <p>
                <strong>Tipo:</strong> {app.tipo_postulacion ?? '—'}
              </p>
              <p>
                <strong>Años operación:</strong> {app.anos_operacion_comercial ?? '—'}
              </p>
              <p>
                <strong>Respuestas con nivel:</strong> {app.answers.length}
              </p>
              <p className="text-zinc-500">
                Al enviar se aplicará descarte → score → IRL (motor_v1.1). El puntaje no lo calcula la IA.
              </p>
              {msg && <p className="text-red-600 text-sm">{msg}</p>}
              <button type="button" onClick={submit} className="w-full bg-[#C8102E] text-white py-3 rounded-full font-medium">
                Enviar postulación
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
            className="text-sm px-4 py-2 rounded-full border disabled:opacity-40"
          >
            Atrás
          </button>
          {step < STEPS.length - 1 && (
            <button type="button" onClick={() => setStep((s) => s + 1)} className="text-sm px-5 py-2 rounded-full bg-zinc-900 text-white">
              Siguiente
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-400 mt-4">
          <Link to="/app" className="underline">
            Volver al panel
          </Link>
          · Autoguardado local
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
        {label} {required ? <span className="text-red-500">*</span> : <span className="text-zinc-400">(opcional)</span>}
      </legend>
      <div className="space-y-1.5">
        {levels.map((n) => (
          <label key={n.label} className="flex gap-2 text-sm items-start">
            <input type="radio" checked={value === n.label} onChange={() => onChange(n.label)} className="mt-1" />
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
}: {
  tipo: TipoPostulacion | null
  irl: Record<string, { level: number; justification: string }>
  onChange: (code: string, level: number, justification: string) => void
}) {
  const dims = tipo ? (catalog.irl_by_tipo[tipo] ?? []) : []
  if (!tipo) return <p className="text-sm text-amber-700">Seleccione tipo de postulación en el paso 1.</p>
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">Dimensiones aplicables: {dims.join(', ')}</p>
      {dims.map((code) => {
        const range = catalog.irl_ranges[code] ?? { min: 1, max: 5 }
        const cur = irl[code] ?? { level: range.min, justification: '' }
        return (
          <div key={code} className="border rounded-xl p-4">
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
              placeholder="Justificación del nivel"
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
