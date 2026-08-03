# Cómo va a funcionar el backend (paso a paso)

> Sin código. Esto es el **guion de operación** del sistema cuando alguien se inscribe.

---

## 1. Qué es el backend en este proyecto

El backend es un **servidor con una API** (puerta de entrada para la web) que:

1. Identifica a la persona (login).  
2. Guarda y lee datos (base de datos + archivos).  
3. Aplica el **motor** (descarte → score → IRL).  
4. Llama a la **IA** solo desde el servidor (para contrastes e **informes**).  
5. Devuelve resultados a la web o al panel de evaluadores.

La web (frontend) **nunca** tiene la API key de OpenAI / DeepSeek / xAI.  
La web **nunca** es la autoridad del puntaje oficial.

```text
Navegador (React)
      │  HTTPS + token de sesión
      ▼
API Backend  ──▶  Motor (reglas)  ──▶  PostgreSQL
      │                                    ▲
      ├──▶  Storage de archivos ───────────┘
      └──▶  Proveedor de IA (solo servidor) ──▶ guarda informe en BD
```

---

## 2. Momentos de la vida de una postulación

### A) Registro / login

1. La persona entra a “Inscribirse” o “Ingresar”.  
2. El backend crea o valida la cuenta (`User`).  
3. Devuelve una **sesión** (JWT o cookie httpOnly).  
4. A partir de ahí, cada request lleva esa sesión.

### B) Borrador del formulario

1. El frontend envía respuestas por pasos:  
   `POST /api/applications` (crear)  
   `PATCH /api/applications/:id/answers` (guardar campos)  
2. El backend valida tipos de dato y guarda en `ApplicationAnswer`.  
3. Si sube un archivo de prototipo:  
   `POST /api/applications/:id/files` → el archivo va a **object storage** (no a la BD como blob gigante); en la BD solo queda la referencia.  
4. Autosave cada cierto tiempo: no se pierde el trabajo.

### C) Envío (submit) — aquí trabaja el motor

1. Frontend: `POST /api/applications/:id/submit`.  
2. Backend comprueba **obligatorios**. Si faltan → error 400, no envía.  
3. Backend corre **Puerta 1 — Descarte**:  
   - Si falla → `status = discarded` + motivos + (opcional) email.  
   - **No** calcula score “para animar”.  
4. Si pasa descarte:  
   - Clasifica **tipo** (desarrollo / salud / adaptación).  
   - Corre **Puerta 2 — Score** (3 bloques, desglose línea a línea).  
   - Corre **Puerta 3 — IRL** (dims que apliquen; guarda autoevaluación).  
5. Guarda `DiscardResult`, `ScoreResult`, `IrlAssessment`.  
6. Encola trabajos de IA (no hace esperar al usuario 30–60 s si no hace falta):  
   - contraste de textos marcados en el Excel  
   - **generación de informe** (ver `PLAN_IA_INFORMES.md`)  
7. Responde al frontend: “enviada / diagnosticada” + datos para la pantalla de resultado.

### D) Consulta de resultado

1. `GET /api/applications/:id/result`  
2. Solo el dueño, o un evaluador/admin.  
3. Incluye score, IRL, estado de informe IA (`pending | ready | failed`).

### E) Panel evaluador / admin

1. Lista de postulaciones con filtros.  
2. Detalle + posibilidad de **override** (con motivo en auditoría).  
3. Export CSV/Excel.  
4. Re-generar informe IA si hace falta.

---

## 3. Módulos del backend (responsabilidades)

| Módulo | Función en simple |
|--------|-------------------|
| `auth` | Quién eres y qué puedes hacer |
| `applications` | Crear, editar borrador, enviar |
| `files` | Subir/bajar adjuntos con URL firmada |
| `engine` | Descarte + score + IRL (determinista, testeable) |
| `ai` | Llamadas al LLM, colas, guardar informes |
| `admin` | Convocatorias, exports, overrides |
| `audit` | Registro de acciones sensibles |

El **motor** es código puro: entra un JSON de respuestas + catálogo de reglas → sale descarte/score/IRL.  
Así se puede probar con casos fijos sin tocar la base de datos.

---

## 4. Dónde viven los datos (recordatorio)

| Dato | Dónde |
|------|--------|
| Usuario, postulación, respuestas, scores, informes | **PostgreSQL** |
| PDF/imagen de prototipo | **Object storage** (S3/Blob/Supabase Storage) |
| API keys de IA | **Solo variables de entorno del servidor** (nunca en React) |
| Catálogo de reglas (pesos, preguntas) | Versionado desde `01_datos_limpios/` |

---

## 5. Seguridad mínima (backend)

- HTTPS.  
- Auth en todas las rutas salvo landing pública.  
- Cada postulación solo la ve su dueño (o rol superior).  
- Rate limit en login y en “generar informe”.  
- No mandar cédula/teléfono al LLM si no es necesario para el informe.  
- Logs sin pegar la API key ni el texto completo de datos sensibles en claro en sitios públicos.

---

## 6. Hosting — decisión de producto: Supabase + Vercel

| Capa | Dónde |
|------|--------|
| Frontend | **Vercel** (URL pública) |
| Auth + Postgres + Storage | **Supabase cloud** |
| Motor (descarte, score, IRL) | **Edge Function** `submit-application` |
| Informes IA | **Edge Function** `generate-report` (solo si hay API key) |

**No** se entrega un backend “que solo corre en localhost / en tu PC”.  
Desarrollo y producción apuntan al **mismo tipo de stack cloud**.  

Detalle de deploy: `06_produccion_supabase_vercel/DEPLOY.md`.  
(Si más adelante la UR exige Azure, se migra el mismo modelo de datos.)

---

## 7. Relación con la IA

El backend **orquesta** la IA:

```text
Submit OK
  → engine calcula números (sin LLM)
  → ai.enqueue("informe_evaluacion", application_id)
  → worker:
        arma prompt con respuestas + score + IRL
        llama API (OpenAI / DeepSeek / xAI)
        valida/guarda markdown o JSON del informe
  → frontend muestra “Informe listo” y PDF/HTML
```

Detalle de proveedores e informes: **`PLAN_IA_INFORMES.md`**.
