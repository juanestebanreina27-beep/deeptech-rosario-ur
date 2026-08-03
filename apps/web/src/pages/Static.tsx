import { SiteNav } from '@/components/SiteNav'

export function Metodologia() {
  return (
    <Shell title="Metodología">
      <ol className="list-decimal pl-5 space-y-3 text-sm text-zinc-700">
        <li>Formulario de postulación (equipo, modelo, innovación).</li>
        <li>Filtros de descarte binarios (vínculo, prototipo, años comerciales, base tech).</li>
        <li>Clasificación de tipo → dimensiones KTH IRL.</li>
        <li>Score DeepTech en 3 bloques (promedio, motor_v1.1).</li>
        <li>Diagnóstico IRL + (opcional) informe narrativo con IA — la IA no puntúa.</li>
        <li>Revisión humana / comité (el software no acepta cupos solo).</li>
      </ol>
    </Shell>
  )
}

export function Faq() {
  return (
    <Shell title="FAQ y privacidad">
      <div className="space-y-4 text-sm text-zinc-700">
        <p>
          <strong>¿La IA decide si quedo dentro?</strong> No. El descarte y el score son reglas del programa
          (motor determinista).
        </p>
        <p>
          <strong>¿Qué datos se tratan?</strong> Datos de postulación y contacto para evaluación DeepTech Rosario,
          conforme a la Ley 1581 de 2012. Responsable: Universidad del Rosario (texto a validar con jurídica).
        </p>
        <p>
          <strong>¿Modo demo?</strong> Si Supabase no está configurado, la app usa almacenamiento local del navegador
          para que puedas probar el flujo completo.
        </p>
      </div>
    </Shell>
  )
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteNav />
      <div className="max-w-2xl mx-auto pt-28 px-4 pb-16">
        <h1 className="text-2xl font-semibold mb-6">{title}</h1>
        <div className="bg-white border rounded-2xl p-6">{children}</div>
      </div>
    </div>
  )
}
