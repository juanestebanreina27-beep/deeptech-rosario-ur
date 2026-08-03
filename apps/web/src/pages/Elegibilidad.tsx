import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteNav } from '@/components/SiteNav'

export function Elegibilidad() {
  const [v, setV] = useState({ vinculo: '', prototipo: '', anos: '', tech: '' })
  const answered = Object.values(v).every(Boolean)
  const fails: string[] = []
  if (v.vinculo === 'no') fails.push('Sin vínculo con la Universidad del Rosario')
  if (v.prototipo === 'idea') fails.push('Solo idea/concepto sin prototipo ni PMV')
  if (v.anos === 'si') fails.push('Más de 3 años de operación comercial')
  if (v.tech === 'no') fails.push('Sin desarrollo ni adopción tecnológica de soporte')
  const apto = answered && fails.length === 0

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteNav />
      <div className="max-w-xl mx-auto pt-28 px-4 pb-16">
        <h1 className="text-2xl font-semibold mb-2">¿Soy elegible?</h1>
        <p className="text-sm text-zinc-600 mb-8">
          Pre-chequeo de los 4 filtros de entrada (sin crear cuenta). No sustituye la evaluación formal.
        </p>
        <div className="space-y-6 bg-white border rounded-2xl p-6">
          <Q
            label="¿Tienes vínculo con la Universidad del Rosario?"
            value={v.vinculo}
            onChange={(x) => setV({ ...v, vinculo: x })}
            options={[
              ['si', 'Sí (temporal, servicios o fijo)'],
              ['no', 'No'],
            ]}
          />
          <Q
            label="¿En qué nivel está el prototipo / producto?"
            value={v.prototipo}
            onChange={(x) => setV({ ...v, prototipo: x })}
            options={[
              ['idea', 'Solo idea o concepto teórico'],
              ['proto', 'Prototipo, validación o ventas'],
            ]}
          />
          <Q
            label="¿Llevas más de 3 años con operación comercial?"
            value={v.anos}
            onChange={(x) => setV({ ...v, anos: x })}
            options={[
              ['no', 'No (3 años o menos)'],
              ['si', 'Sí (más de 3 años)'],
            ]}
          />
          <Q
            label="¿Tienes desarrollo tecnológico propio o adopción de tecnología?"
            value={v.tech}
            onChange={(x) => setV({ ...v, tech: x })}
            options={[
              ['si', 'Sí'],
              ['no', 'No'],
            ]}
          />
        </div>
        {answered && (
          <div className={`mt-6 rounded-2xl p-5 border ${apto ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            {apto ? (
              <>
                <p className="font-semibold text-emerald-900">Pre-chequeo: podrías ser elegible</p>
                <p className="text-sm text-emerald-800 mt-1">Continúa con la inscripción y el formulario completo.</p>
                <Link to="/auth/registro" className="inline-block mt-4 bg-[#C8102E] text-white px-6 py-2.5 rounded-full text-sm">
                  Inscribirse
                </Link>
              </>
            ) : (
              <>
                <p className="font-semibold text-red-900">Pre-chequeo: no cumples elegibilidad actual</p>
                <ul className="mt-2 text-sm text-red-800 list-disc pl-5">
                  {fails.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Q({
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
    <fieldset>
      <legend className="text-sm font-medium text-zinc-800 mb-2">{label}</legend>
      <div className="space-y-2">
        {options.map(([val, lab]) => (
          <label key={val} className="flex gap-2 text-sm items-center">
            <input type="radio" name={label} checked={value === val} onChange={() => onChange(val)} />
            {lab}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
