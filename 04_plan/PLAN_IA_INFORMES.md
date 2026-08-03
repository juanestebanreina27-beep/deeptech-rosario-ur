# Plan de IA — informes y contraste (sin implementar aún)

> Objetivo: usar un **LLM por API** para generar informes de evaluación/diagnóstico y contrastar textos del formulario.  
> Las **claves van solo en el backend**. El puntaje numérico lo calcula el **motor**, no la IA.

---

## 1. ¿Es posible? — Sí

Es totalmente viable y es el diseño natural de este proyecto:

| Qué hace la IA | Qué NO debe hacer la IA |
|----------------|-------------------------|
| Redactar **informe** legible para el postulante y para transferencia | Inventar el % del score oficial |
| Contrastar problema / valor / tech vs. mercado | Saltarse el descarte binario |
| Sugerir nivel IRL y explicar brechas | Guardar la API key en el frontend |
| Resumir fortalezas y recomendaciones | Enviar cédula/teléfono sin necesidad |

**Flujo correcto:**

```text
Motor (reglas Excel)  →  números trazables
         +
LLM (informe)         →  narrativa + recomendaciones
         =
Informe profesional guardado en BD / exportable PDF
```

---

## 2. Para qué la IA en este producto (casos de uso)

### Caso A — Informe de diagnóstico (el que pides)

Tras el submit (si no está descartada), generar un documento tipo:

1. Resumen ejecutivo del emprendimiento  
2. Resultado de elegibilidad (pasó descarte)  
3. Score por bloques (tomado del motor, no inventado)  
4. Lectura de cada bloque (qué pesó más / menos)  
5. Perfil IRL (radar en texto + brechas)  
6. Hallazgos del contraste (problema, valor, tech, competencia…)  
7. Recomendaciones priorizadas para el programa de transferencia  
8. Riesgos / datos faltantes  

Formatos de salida recomendados:

- `informe.json` estructurado (para la UI)  
- `informe.md` o HTML (para PDF)  

### Caso B — Contraste por campo (ya previsto en el Excel)

Donde `analisis_ia.activo = true` en `postulacion.json`:

- ¿El problema ya está resuelto en el mercado?  
- ¿La propuesta de valor es genérica?  
- ¿Hay tecnologías similares?  
- etc.

### Caso C — (Opcional fase 2) Asistente del evaluador

Chat interno solo admin: “¿por qué este score es bajo en equipo?”  
Misma API, otro prompt, mismos permisos estrictos.

---

## 3. Proveedores: OpenAI, DeepSeek y alternativas

### 3.1 Comparación práctica

| Proveedor | Pros | Contras / cuidado | ¿Viable? |
|-----------|------|-------------------|----------|
| **OpenAI** | Calidad alta, docs maduras, JSON mode, amplia adopción | Costo; política de datos y DPA con la universidad; latencia | **Sí** |
| **DeepSeek** | Muy buen costo/calidad; API compatible estilo OpenAI | Empresa/infra en China: **revisar con TI/privacidad UR** si datos de investigación salen del país; disponibilidad y ToS | **Sí, con OK legal** |
| **xAI (SpaceXAI / Grok)** | API compatible OpenAI; buen razonamiento; default recomendado en stack Grok Build | Menos “marca genérica” en RFPs; verificar DPA | **Sí (recomendado técnico aquí)** |
| Azure OpenAI | Encaja con universidades en Microsoft 365 / residencia controlada | Más setup con TI | **Sí, ideal institucional** |

### 3.2 Recomendación de arquitectura (multi-proveedor)

No atar el código a un solo vendor. Diseñar un **adaptador**:

```text
AiProvider interface
  - complete(prompt, schema?) → text/json

Implementaciones:
  - OpenAiProvider     (OPENAI_API_KEY, base default)
  - DeepSeekProvider   (DEEPSEEK_API_KEY, base DeepSeek)
  - XaiProvider        (XAI_API_KEY, base https://api.x.ai/v1)
  - AzureOpenAiProvider (si TI lo pide)
```

En `.env` del **servidor**:

```env
AI_PROVIDER=openai|deepseek|xai|azure
OPENAI_API_KEY=...
DEEPSEEK_API_KEY=...
XAI_API_KEY=...
AI_MODEL=...
```

Cambiar de proveedor = cambiar env, no reescribir el producto.

### 3.3 “Lo más seguro” en la práctica

“Seguro” no es solo el logo del proveedor. Es:

1. **Key solo en servidor** (nunca `VITE_` / nunca en el bundle React).  
2. **Mínimo de datos personales** en el prompt (nombre del proyecto y textos de negocio; evitar cédula, celular, correo si no aportan al informe).  
3. **HTTPS**, logs sin volcar el prompt completo con PII a sitios públicos.  
4. **Rate limit** y cupos por usuario (anti-abuso de costos).  
5. **Contrato / DPA** con el proveedor y OK de la UR si los datos son de investigación.  
6. Preferir **no entrenar** con esos datos (flags de API “no training” cuando existan).  
7. Si la UR exige residencia: **Azure OpenAI** en región acordada gana sobre DeepSeek/OpenAI global.

**Respuesta directa a “OpenAI o DeepSeek, ¿se puede?”**  
**Sí.** Ambos se pueden integrar igual (API HTTP + key en backend).  
La decisión final es **costo + calidad + privacidad de la universidad**, no un límite técnico.

**Default técnico al construir con este entorno Grok:** empezar con **xAI (`XAI_API_KEY`)** por compatibilidad y flujo de desarrollo; dejar OpenAI y DeepSeek como opciones configurables desde el día 1 del diseño (no del código aún).

---

## 4. Diseño del pipeline de informe

```text
[Submit OK + motor terminó]
        │
        ▼
Cola de jobs: type = "report_v1", application_id
        │
        ▼
Worker arma CONTEXT:
  - metadatos no sensibles (facultad, sector, tipo)
  - respuestas de negocio (textos)
  - score_result (números del motor, línea a línea)
  - irl_assessments
  - reglas version (rules_version)
        │
        ▼
LLM con system prompt fijo (plantilla institucional UR)
  + user payload = CONTEXT en JSON
  + response_format JSON schema (si el proveedor lo soporta)
        │
        ▼
Validar JSON del informe
  - si falla schema → 1 reintento con “corrige el JSON”
  - si vuelve a fallar → status=failed, mensaje humano
        │
        ▼
Guardar en BD: ai_reports
  - application_id
  - provider, model, prompt_version
  - content_json, content_md
  - created_at
        │
        ▼
Frontend: “Informe listo” + vista + export PDF (fase posterior)
```

### Tabla propuesta `ai_reports`

| Campo | Uso |
|-------|-----|
| id | UUID |
| application_id | FK |
| kind | `diagnostico` / `contraste_campo` |
| provider | openai / deepseek / xai |
| model | ej. gpt-4.1, deepseek-chat, grok-4.5 |
| prompt_version | para reproducibilidad |
| status | pending / running / ready / failed |
| content_json | estructura del informe |
| content_md | texto legible |
| error | si failed |
| tokens_in / tokens_out | control de costos |
| created_at / finished_at | |

---

## 5. Plantilla del system prompt (borrador conceptual)

No es el prompt final de producción; es el **esqueleto** para cuando se implemente:

```text
Eres analista de transferencia tecnológica de la Universidad del Rosario.
Redactas informes de selección DeepTech en español (Colombia), tono profesional y claro.

REGLAS DURAS:
- NO inventes puntajes: usa SOLO los números del objeto score_result.
- NO inventes dimensiones IRL: usa SOLO irl_assessments.
- Si un dato no está en el contexto, dilo explícitamente (“no informado”).
- No incluyas cédula, teléfono ni correo en el informe.
- Separa hechos del formulario de tu interpretación.
- Cierra con recomendaciones accionables (máx. 7), priorizadas.

Estructura de salida JSON:
{
  "resumen_ejecutivo": "...",
  "elegibilidad": { "apto": true, "notas": "..." },
  "lectura_score": { "total": 0, "bloques": [], "fortalezas": [], "debilidades": [] },
  "lectura_irl": { "dims": [], "brechas_prioritarias": [] },
  "contrastes": [],
  "recomendaciones": [],
  "limitaciones_del_analisis": []
}
```

Los pesos y variables reales salen de `01_datos_limpios/`.

---

## 6. Costos y límites (para no sorprenderse)

| Concepto | Práctica recomendada |
|----------|----------------------|
| Un informe por submit | Sí (y botón “regenerar” solo admin o 1 vez/día) |
| Contraste por campo | Lazy: al abrir resultado o en cola post-submit |
| Tope tokens | Truncar textos muy largos del form (ej. 4–8k chars por campo) |
| Presupuesto | Dashboard simple de tokens/mes en admin |
| Fallo del proveedor | La postulación **sigue válida**: score e IRL del motor no dependen del LLM |

**Principio:** si OpenAI/DeepSeek cae, el sistema de selección **sigue funcionando**; solo falta el informe narrativo.

---

## 7. Cumplimiento con la Universidad

Antes de producción real con datos de investigadores:

- [ ] Aviso de privacidad: “sus textos pueden procesarse con un proveedor de IA X para generar el diagnóstico”.  
- [ ] Lista de campos que **nunca** van al LLM.  
- [ ] Proveedor aprobado por TI/jurídica (OpenAI, DeepSeek, Azure OpenAI o xAI).  
- [ ] Región / DPA si aplica.  
- [ ] Retención: ¿se borran informes al cerrar convocatoria?

---

## 8. Criterios de “listo para cablear IA” (cuando se construya)

- [ ] Motor de score/descarte cerrado (SPEC motor).  
- [ ] Backend con jobs async.  
- [ ] `.env` con proveedor elegido.  
- [ ] Schema JSON del informe validado.  
- [ ] 3 postulaciones sintéticas de prueba (sin datos reales).  
- [ ] UI: estados pending / ready / failed.

---

## 9. Decisión pendiente (tú / la UR)

| Pregunta | Opciones |
|----------|----------|
| Proveedor MVP | OpenAI / DeepSeek / xAI / Azure OpenAI |
| Proveedor producción | ¿El que apruebe TI? |
| Idioma del informe | Español (default) |
| ¿PDF automático? | Fase 1: HTML/MD en pantalla; Fase 2: PDF |
| ¿El postulante ve el informe completo o solo un resumen? | Definir con transferencia |

**Recomendación de arranque (cuando construyamos):**

1. Motor determinista primero.  
2. Informes con **un** proveedor (xAI o OpenAI) vía adaptador.  
3. Dejar DeepSeek como segundo `AI_PROVIDER` listo en config.  
4. Si la UR exige ecosistema Microsoft → migrar el mismo diseño a **Azure OpenAI**.
