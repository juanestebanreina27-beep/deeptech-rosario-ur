# Decisiones cerradas — v1.1 (post-auditoría multinacional)

Estas decisiones **no se reabren en implementación** salvo acta de Transferencia UR.

---

## 1. Producto

| Decisión | Valor |
|----------|--------|
| Nombre UI | **DeepTech Rosario** |
| Subtítulo | Programa de selección y diagnóstico de transferencia tecnológica · Universidad del Rosario |
| Propósito v1 | Admisión + score + diagnóstico IRL + panel staff (no CRM completo) |
| Score decide aceptación automática | **No** — ranking e input a comité humano |
| IA en v1 convocatoria | **OFF por defecto** (`ai_reports.status = skipped`); se enciende con API key + decisión de producto |

---

## 2. Stack y hosting

| Decisión | Valor |
|----------|--------|
| Frontend | **React 18 + TS + Vite + Tailwind + React Router** (no Next en v1) |
| Backend | **Supabase cloud** (Auth, Postgres, Storage, Edge Functions) |
| Deploy front | **Vercel** |
| Localhost | No es runtime de entrega; solo opcional para dev del implementador |
| Migración futura UR | Azure + Entra posible **sin reescribir motor** (mismo schema lógico) |
| Motor runtime | Edge Function `submit-application` con **service role**; cliente **nunca** escribe scores |

---

## 3. Motor `motor_v1.1`

| Decisión | Valor |
|----------|--------|
| Fórmula variable | `norm = points/max_catalog`; `contrib = norm * peso_efectivo` |
| Opcionales vacías | Omitir + renormalizar **solo** variables con peso ≤ 0.10 o marcadas `renorm_ok` |
| `grado_innovacion` (0.35) | **Obligatorio si `innovacion.points >= 3`**; si innovacion &lt; 3, puede omitirse |
| Total | Promedio simple de 3 bloques no nulos |
| Escala UI | `total_0_100` con 1 decimal |
| Autoridad de puntos | **Solo catálogo servidor**; ignorar `score_points` del cliente |
| rules_version | `motor_v1.1` |

### Descarte

| ID | Condición |
|----|-----------|
| D01 | `vinculo_universidad.points == 0` |
| D02 | `prototipos.points == 0` |
| D03 | `anos_operacion_comercial > 3` |
| D04 | `tipo == adaptacion_tecnologica AND adopcion_tecnologia.points == 0` |

Tabla D04 (única verdad):

| tipo | adopcion=0 | ¿D04? |
|------|------------|-------|
| desarrollo_tecnologico | cualquiera | No |
| desarrollo_tecnologico_salud | cualquiera | No |
| adaptacion_tecnologica | sí (0) | **Sí** |
| adaptacion_tecnologica | no (&gt;0) | No |

### Grupo de investigación (rúbrica corregida)

| Nivel | Puntos |
|-------|--------|
| No pertenece | 0 |
| Categoría C | 2 |
| Categoría B | 3 |
| Categoría A | 4 |
| Categoría A1 | 5 |

*(Corrige inversión del Excel original donde A1 valía menos que C.)*

### Vínculo universidad

| Nivel | Puntos |
|-------|--------|
| NO vinculado | 0 → también D01 |
| Temporal / servicios | 3 |
| Fijo / indefinido | **5** |

---

## 4. Datos y privacidad

| Decisión | Valor |
|----------|--------|
| Cédula | No obligatoria en submit v1; si se captura, nunca al LLM |
| Consentimiento | `consent_at` + `privacy_version` obligatorios antes de submit |
| Export PII | Solo admin + flag + audit |
| Postulante descartado | Ve motivos; **no** ve score de selección |
| Retención default propuesta | 5 años post-cierre call (firmar con UR) |

---

## 5. UX

| Decisión | Valor |
|----------|--------|
| CTA | Inscribirse (cuenta) · Ingresar (login) · Postular / Comenzar postulación (wizard) |
| Pre-check elegibilidad | Paso 0 o pantalla antes del wizard largo |
| Hero | Mecánica Lithos + marca UR; assets locales; sin Higgs |
| Tipografía | Inter app; Playfair **solo** una línea del hero (o full Inter si Comunicación UR rechaza) |
| Mobile spotlight | Sin follow; reveal centrado u opacidad fija |

---

## 6. Seguridad

| Decisión | Valor |
|----------|--------|
| `profiles.role` | Solo service role / admin staff function |
| Answers/files post-submit | Inmutables para postulante si status ≠ draft |
| 1 postulación por user por call | UNIQUE (user_id, call_id) |
| Resultados motor | UNIQUE por application_id + rules_version |
