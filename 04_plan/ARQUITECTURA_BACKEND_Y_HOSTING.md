# Arquitectura backend, datos y hosting — DeepTech U. Rosario

> **Estado:** propuesta de arquitectura (auditoría / diseño).  
> **No implementado.** Debe validarse con TI / Transferencia de la Universidad del Rosario antes de Fase 5.

---

## 1. Qué problema de sistemas resolvemos

No es solo un “formulario bonito”. Es un **sistema de inscripción + evaluación + diagnóstico** donde:

| Actor | Qué hace | Qué necesita guardar |
|-------|----------|----------------------|
| **Postulante** (investigador / emprendedor vinculado a UR) | Se registra, completa postulación, sube evidencias, ve estado y diagnóstico | Cuenta, borradores, respuestas, archivos, resultados |
| **Evaluador / transferencia tecnológica** | Revisa, re-puntúa, valida descarte, comenta, exporta | Roles, revisiones, overrides de score, notas |
| **Administrador del programa** | Convoca, cierra convocatoria, exporta reportes, gestiona catálogos | Config de convocatoria, listas, auditoría |
| **Servicio de IA** | Contrasta textos (problema, valor, tech, IRL…) | Prompts, salidas, trazas (sin filtrar datos sensibles a logs públicos) |
| **Universidad (TI / cumplimiento)** | Aloja o aprueba el alojamiento, SSO, backups, retención | Políticas de datos personales (Ley 1581/2012 COL) |

**Implicación:** los datos **no pueden vivir solo en el navegador ni en un Excel compartido**. Hace falta:

1. **Identidad** (quién postula / quién evalúa).  
2. **Persistencia** (postulación, score, IRL, archivos).  
3. **Motor de reglas** (descarte → tipo → score → IRL).  
4. **Hosting confiable** que la UR acepte (o un MVP cloud con plan de migración).

---

## 2. Principios de diseño

1. **Fuente de verdad de reglas de negocio** = `01_datos_limpios/` (versionada en repo); en runtime se **importa/versiona** en BD o config, no se hardcodea a ciegas en el front.
2. **Separación frontend / API / datos** — el front no calcula el score “oficial”; el **backend** es autoridad del puntaje (trazable, auditable).
3. **Descarte y score son server-side** — no confiar en validaciones solo de cliente.
4. **Mínimo de datos personales** + consentimiento + retención definida.
5. **Arquitectura modular** (mismo espíritu IncubaLab 2.0): catálogos, filtros, score, IRL, auth, storage como módulos claros.
6. **No reutilizar** datos/modelos de HUB iEX / El Bosque.

---

## 3. Flujo de sistema (end-to-end)

```text
[Landing hero] → [Registro / Login] → [Dashboard postulante]
        → [Formulario multi-paso / borrador auto-save]
        → [Submit]
             → API: validar obligatorios
             → API: compuerta DESCARTE (binaria, trazable)
             → si RECHAZADA: estado=descartada + motivo + email
             → si APTA:
                  → clasificar TIPO (desarrollo / salud / adaptación)
                  → calcular SCORE (3 bloques, desglose)
                  → capturar / contrastar IRL (dims condicionales)
                  → (async) jobs de ANÁLISIS IA en campos marcados
             → Panel resultado + PDF/export admin
```

Estados de una postulación (propuesta):

| Estado | Significado |
|--------|-------------|
| `draft` | Borrador editable |
| `submitted` | Enviada; en evaluación automática |
| `discarded` | Falló filtro de entrada (motivo en `discard_reason`) |
| `scored` | Score + IRL calculados |
| `under_review` | En revisión humana |
| `accepted` / `waitlisted` / `rejected` | Decisión de programa (humana) |
| `archived` | Cierre de convocatoria |

---

## 4. Modelo de datos (lógico)

### 4.1 Entidades principales

```text
User
  id, email, password_hash | sso_subject
  full_name, document_id (cédula), phone
  role: postulante | evaluador | admin
  faculty_id?, created_at, consent_at, last_login_at

Call (Convocatoria)
  id, name, year, opens_at, closes_at, is_active
  rules_version  ← apunta a versión de catálogos/score/IRL

Application (Postulación)
  id, call_id, user_id
  status, tipo_postulacion (desarrollo|salud|adaptacion|null)
  sector_id, faculty_id
  submitted_at, created_at, updated_at
  current_step  ← UX multi-paso

ApplicationAnswer
  id, application_id
  variable_key          ← clave canónica (post-mapeo Fase 1)
  value_text | value_number | value_option
  score_level_label?, score_points?
  is_optional_skipped?

ApplicationFile
  id, application_id, variable_key?
  storage_key, filename, mime, size_bytes, uploaded_at

DiscardResult
  id, application_id
  passed: boolean
  failed_rules: json[]   ← [{ rule_id, label, evidence }]
  evaluated_at

ScoreResult
  id, application_id, rules_version
  block_equipo, block_modelo, block_innovacion
  total_score
  formula_id            ← trazabilidad de la fórmula elegida en Fase 2
  line_items: json[]    ← { variable_key, points, max, weight, contribution }
  computed_at

IrlAssessment
  id, application_id
  dimension_code (TRL|BRL|...)
  self_level, self_justification
  ia_suggested_level?, ia_rationale?
  final_level?          ← si evaluador ajusta
  applies: boolean      ← false si dim no aplica al tipo

AiAnalysisJob
  id, application_id, field_key
  status, model, prompt_version
  input_hash, output_json, error
  created_at, finished_at

AuditLog
  id, actor_user_id?, entity_type, entity_id
  action, payload_json, ip?, created_at
```

### 4.2 Catálogos (versionados)

Importados desde `01_datos_limpios/` al desplegar o por admin:

| Catálogo | Origen |
|----------|--------|
| Variables de postulación + niveles | `postulacion.json` |
| Pesos score | `score_deeptech.json` + mapeo canónico |
| Dimensiones/niveles IRL | `diagnostico_kth_irl.json` |
| Reglas descarte + tipos | `proceso_seleccion_deeptech.json` → futuro `reglas_descarte.json` |
| Facultades / sectores | `listas_desplegables.json` |

**Importante:** guardar `rules_version` en cada `ScoreResult` / `DiscardResult` para que un cambio futuro de pesos **no reescriba la historia**.

### 4.3 Datos personales y archivos

| Dato | Clasificación | Notas |
|------|---------------|-------|
| Nombre, correo, cédula, celular | Datos personales | Cifrado en tránsito (TLS); acceso por rol |
| Archivos de prototipo | Pueden contener IP / datos sensibles | Storage privado, URLs firmadas, virus scan ideal |
| Textos de negocio / tech | Confidencial de investigación | No usar para entrenar modelos de terceros sin acuerdo |
| Salidas de IA | Derivados | Retención alineada a la postulación |

**Cumplimiento (Colombia):** Ley 1581 de 2012, decreto 1377/2013 — aviso de privacidad, finalidad (selección DeepTech UR), responsable del tratamiento (Universidad), derechos ARCO, tiempo de retención (definir con UR: p. ej. 5 años post-convocatoria).

---

## 5. Dónde se aloja: opciones realistas para la UR

### 5.1 Criterios de decisión (preguntar a TI Rosario)

| Criterio | Pregunta a TI / Transferencia |
|----------|-------------------------------|
| Dominio | ¿Puede ser `deeptech.urosario.edu.co` o subdominio de transferencia? |
| SSO | ¿Microsoft 365 / Entra ID institucional para login? |
| Cloud preferido | ¿Azure, AWS, on-prem, o proveedor ya contratado? |
| Datos en el exterior | ¿Restricción de residencia de datos (Colombia / LATAM)? |
| Presupuesto | ¿Solo hosting gratuito de arranque o cuenta cloud de facultad? |
| Mantenimiento | ¿Quién opera post-entrega (equipo interno vs. proveedor)? |
| Correo | ¿SMTP institucional para notificaciones de postulación? |

### 5.2 Opción A — **Recomendada para producción UR** (institucional)

**Stack Microsoft / Azure** (común en universidades con M365):

| Capa | Servicio | Rol |
|------|----------|-----|
| Frontend | Azure Static Web Apps **o** App Service (Node) | React SPA |
| API | Azure App Service / Container Apps | Node/Nest o Python/FastAPI |
| BD | Azure Database for PostgreSQL Flexible | Datos relacionales |
| Archivos | Azure Blob Storage (private) | Prototipos, PDFs |
| Auth | Microsoft Entra ID (SSO) + roles app | Postulantes con cuenta UR; invitados si aplica |
| Secretos | Azure Key Vault | API keys IA, DB |
| Colas / jobs | Azure Queue + Function o worker | Análisis IA async |
| Email | Microsoft 365 SMTP / ACS Email | Confirmaciones |
| CDN / WAF | Front Door / CDN | HTTPS, cache assets |
| Observabilidad | App Insights | Logs, errores |

**Pros:** encaja con gobernanza universitaria, SSO, backups, contratos.  
**Contras:** más setup y posible fricción con TI; no es el MVP más rápido.

### 5.3 Opción B — **MVP rápido con plan de migración** (recomendada para construir ya, migrar después)

| Capa | Servicio | Rol |
|------|----------|-----|
| Frontend | **Vercel** (o Netlify) | React + Vite |
| API + Auth + DB + Storage | **Supabase** (Postgres + Auth + Storage + RLS) | Backend BaaS |
| Jobs IA | Supabase Edge Functions **o** worker en Railway | Async |
| Secretos | Env vars Vercel/Supabase | |
| Dominio | Custom domain provisional → luego `.urosario.edu.co` | |

**Pros:** velocidad, Postgres real, RLS por fila, storage integrado, costo bajo al inicio.  
**Contras:** datos en cloud de terceros; requiere contrato/DPA y OK de privacidad UR; migración posterior a Azure.

### 5.4 Opción C — **Bajo código institucional** (solo si el alcance se reduce)

Power Apps + SharePoint lists + Power Automate + Power BI.

**Pros:** ya dentro del ecosistema M365.  
**Contras:** motor de score/IRL/IA y UX tipo “spotlight hero” **no encajan bien**; se desaconseja para este brief.

### 5.5 Opción D — **On-prem UR**

VMs en datacenter universitario (nginx + Docker + Postgres).

**Pros:** control total.  
**Contras:** lentitud de despliegue, certificados, backups a cargo de TI; solo si lo exigen.

---

## 6. Recomendación de arquitectura (default de este plan)

```text
                    ┌─────────────────────────┐
                    │  CDN / Dominio UR        │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              │  Frontend SPA                      │
              │  React 18 + TS + Vite + Tailwind   │
              │  (Vercel MVP → Azure SWA prod)     │
              └─────────────────┬─────────────────┘
                                │ HTTPS / JWT
              ┌─────────────────▼─────────────────┐
              │  API Backend                       │
              │  (NestJS o FastAPI)                │
              │  - Auth / roles                    │
              │  - Postulaciones CRUD              │
              │  - Motor descarte + score + IRL    │
              │  - Orquestación IA                 │
              └─────┬─────────────┬───────────┬───┘
                    │             │           │
           ┌────────▼──┐  ┌───────▼────┐  ┌───▼────────┐
           │ PostgreSQL │  │ Object     │  │ Provider   │
           │            │  │ Storage    │  │ LLM (IA)   │
           └────────────┘  └────────────┘  └────────────┘
```

### 6.1 Dónde vive cada tipo de información

| Información | Almacén | Acceso |
|-------------|---------|--------|
| Cuentas y roles | Postgres `users` (+ SSO claims) | Auth service |
| Respuestas del formulario | Postgres `application_answers` | Dueño + evaluadores |
| Archivos (prototipo, PDF) | Object storage (Blob/S3/Supabase Storage) | URL firmada, no pública |
| Resultado descarte / score / IRL | Postgres tablas de resultado + JSON desglose | Lectura por rol |
| Catálogos de reglas | Repo git + tabla `rules_versions` en Postgres | Admin |
| Análisis IA | Postgres `ai_analysis_jobs` | Dueño + evaluador; no exponer raw a anónimos |
| Logs de auditoría | Postgres `audit_log` (o Log Analytics en Azure) | Solo admin |
| Assets estáticos UI (logos, hero) | CDN / frontend build + `02_recursos` en repo | Público |

### 6.2 Auth: quién se inscribe

Escenario realista para Rosario:

1. **Postulante con vínculo UR**  
   - Ideal: login con **correo institucional** (`@urosario.edu.co`) vía SSO Entra ID **o** magic link restringido a dominio.  
   - El filtro de descarte “sin vínculo” se valida además con el campo del formulario y, si hay SSO, con el directorio.

2. **Postulante externo / temporal** (si el programa lo permite)  
   - Registro email + verificación; el descarte por vínculo lo elimina del proceso si no califica.

3. **Evaluador / admin**  
   - Cuentas invitadas por admin o grupo Entra ID `DeepTech-Evaluadores`.

**Nunca** dejar el panel de evaluación sin autenticación.

### 6.3 API (módulos)

| Módulo | Responsabilidad |
|--------|-----------------|
| `auth` | Login, JWT/session, roles |
| `catalogs` | Facultades, sectores, variables versionadas |
| `applications` | CRUD, borrador, submit |
| `files` | Upload multipart → storage |
| `engine.discard` | Compuerta binaria |
| `engine.score` | Pesos, normalización, desglose |
| `engine.irl` | Dimensiones condicionales |
| `ai` | Cola de contraste de textos |
| `admin` | Convocatorias, export CSV/Excel, overrides |
| `audit` | Append-only log |

El motor de evaluación debe ser un **paquete puro** (funciones deterministas testeables) alimentado por catálogos versionados — mismo patrón “archivos separados por responsabilidad” del brief.

### 6.4 IA en el backend

| Qué | Cómo |
|-----|------|
| Cuándo corre | Tras `submit` o al guardar campos con `analisis_ia.activo` |
| Dónde | Worker async (no bloquear el submit del usuario) |
| Qué se envía al modelo | Textos de negocio + rúbrica; **minimizar** cédula/teléfono |
| Qué se guarda | Resumen estructurado JSON + modelo + versión de prompt |
| Proveedor | Definir en Fase 5 (p. ej. SpaceXAI / otro); clave solo en servidor |

---

## 7. Seguridad (mínimo viable)

- HTTPS obligatorio.  
- Contraseñas hasheadas (si no hay SSO puro) o solo SSO.  
- RLS o checks de autorización en **cada** query (`user_id` / rol).  
- Rate limit en login y submit.  
- Validación de tamaño/tipo de archivos (p. ej. PDF/PNG/JPG, máx. 10–20 MB).  
- Sanitizar HTML; no ejecutar contenido subido.  
- Backups diarios de Postgres + retención de blobs.  
- Separar env: `dev` / `staging` / `prod`.  
- No commitear `.env` ni keys.

---

## 8. Entornos

| Entorno | Uso | Datos |
|---------|-----|-------|
| `local` | Dev | Seed sintético, sin datos reales de investigadores |
| `staging` | QA con UR | Datos ficticios o anonimizados |
| `prod` | Convocatoria real | Solo prod; acceso restringido |

---

## 9. Decisiones abiertas (checklist con la universidad)

- [ ] Cloud: **Azure institucional** vs **Supabase/Vercel MVP**  
- [ ] Dominio final y certificado  
- [ ] SSO Entra ID sí/no y alcance de correos permitidos  
- [ ] ¿Postulantes solo con vínculo UR o también externos?  
- [ ] Política de retención y aviso de privacidad (texto legal)  
- [ ] Quién es administrador de producción  
- [ ] Presupuesto mensual estimado (compute + storage + IA)  
- [ ] Export obligatorio a Excel para reportes internos  
- [ ] Integración futura con CRM / SIU / otros sistemas UR  

---

## 10. Relación con fases del plan

| Fase | Entregable de esta arquitectura |
|------|----------------------------------|
| 1–2 | Motor como **módulo puro** + mapeo de variables (sin hosting aún) |
| 4 | Front con design system; puede mockear API |
| 5 | API + BD + storage + auth + deploy MVP |
| 6 | Casos de prueba E2E sobre staging |
| 7 | Handoff: diagramas, `.env.example`, runbooks, DPA |

---

## 11. Resumen ejecutivo para la contraparte

> La herramienta debe **alojar inscripciones reales**: cuentas, respuestas, archivos y resultados de evaluación.  
> **Frontend** (React) en CDN/hosting web; **backend** (API) calcula descarte, score e IRL de forma auditable; **PostgreSQL** guarda el expediente; **object storage** guarda adjuntos; **login** preferiblemente institucional.  
> Para arrancar rápido se puede usar **Vercel + Supabase**; para producción alineada a la UR, migrar o desplegar en **Azure + Entra ID** bajo el dominio de la universidad.  
> Los JSON de `01_datos_limpios/` no sustituyen la base de datos: son el **diccionario de reglas** que el backend versiona y aplica.
