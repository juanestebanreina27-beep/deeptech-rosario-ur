# SPEC del motor de evaluación — DeepTech Rosario

> **Versión:** `motor_v1.1` (post-auditoría multinacional)  
> **Estado:** cerrada para implementación en **producto real** (Supabase + Vercel).  
> **IA de informes:** NO forma parte del motor. El motor es 100% determinista.  
> **Catálogo ejecutable:** `01_datos_limpios/rules_catalog_motor_v1.json`  
> **Decisiones de panel:** `05_debate_validacion/DECISIONES_CERRADAS_V1_1.md`

---

## 1. Orden de ejecución (obligatorio)

```text
submit
  → validar obligatorios
  → DISCARD (compuerta binaria)
  → si discarded: STOP (sin score oficial de selección)
  → determinar TIPO_POSTULACION + set IRL
  → SCORE (3 bloques → total)
  → persistir IRL (autoevaluación del postulante en dims aplicables)
  → (opcional, aparte) job "generar informe" si hay API key configurada
```

`rules_version` a guardar en cada resultado: **`motor_v1.1`**.

**Autoridad de puntos:** el servidor **ignora** `score_points` enviados por el cliente y recalcula desde el catálogo.

---

## 2. Fórmula de score (cerrada)

### 2.1 Por variable

```text
max_i     = máximo puntaje entre los niveles de esa variable
norm_i    = puntos_obtenidos_i / max_i     ∈ [0, 1]
contrib_i = norm_i × peso_i                ∈ [0, peso_i]
```

- Si la variable es **obligatoria** y falta → **no se permite submit** (error de validación).  
- Si la variable es **opcional** y está vacía:
  - Solo se omite y se **renormaliza** si `renorm_ok=true` o `peso ≤ 0.10` (competencia, aliados).
  - **`grado_innovacion` (peso 0.35):** es **obligatoria si `innovacion.points ≥ 3`**. Si innovacion &lt; 3, puede omitirse (renorm del resto del bloque). No se permite omitirla para “esquivar” un grado bajo cuando sí hay innovación.

```text
peso_efectivo_i = peso_i / sum(pesos de variables respondidas del bloque)
contrib_i       = norm_i × peso_efectivo_i
```

Si un bloque queda con **cero** variables respondidas → `score_bloque = null` y no entra al total.

### 2.2 Por bloque

```text
score_bloque = sum(contrib_i)   ∈ [0, 1]
```

Bloques:

| id | nombre |
|----|--------|
| `EQUIPO` | Equipo de trabajo |
| `MODELO` | Modelo de negocio |
| `INNOVACION` | Innovación / Tecnología |

### 2.3 Total (combinación de bloques) — DECISIÓN CERRADA

```text
score_total = promedio simple de los score_bloque no nulos
            = (EQUIPO + MODELO + INNOVACION) / 3
```

- Cada bloque pesa **igual (1/3)** en el total.  
- Escala de presentación: `score_total_0_100 = round(score_total × 100, 1)`.  
- Siempre devolver **desglose** `line_items[]` y `bloques[]` (trazabilidad).

### 2.4 Mapeo score ↔ formulario (canónico)

Usar **`variable_key`** canónica en BD y en motor:

| variable_key | peso | bloque | max_pts típico | obligatorio score |
|--------------|------|--------|----------------|-------------------|
| `nivel_educativo` | 0.25 | EQUIPO | 5 | sí (en form) |
| `conformacion_equipo` | 0.10 | EQUIPO | 5 | sí |
| `experiencia_profesional` | 0.20 | EQUIPO | 5 | sí |
| `grupo_investigacion` | 0.20 | EQUIPO | 5 | sí |
| `dedicacion_tiempo` | 0.05 | EQUIPO | 5 | sí |
| `vinculo_universidad` | 0.20 | EQUIPO | 5 | sí |
| `problema_oportunidad` | 0.20 | MODELO | 5 | sí |
| `propuesta_valor` | 0.20 | MODELO | 5 | sí |
| `desarrollo_tecnologico` | 0.20 | MODELO | 5 | sí |
| `prototipos` | 0.20 | MODELO | 5 | sí |
| `diferencial` | 0.11 | MODELO | 5 | sí |
| `competencia` | 0.03 | MODELO | 5 | **opcional** |
| `aliados` | 0.02 | MODELO | 5 | **opcional** |
| `estrategia_pi` | 0.02 | MODELO | 5 | sí |
| `gestion_financiera` | 0.01 | MODELO | 5 | sí |
| `gestion_inversiones` | 0.01 | MODELO | 5 | sí |
| `innovacion` | 0.15 | INNOVACION | 5 | sí |
| `grado_innovacion` | 0.35 | INNOVACION | 5 | **opcional** (renorm si vacío) |
| `madurez_tecnologica` | 0.30 | INNOVACION | 5 | sí |
| `adopcion_tecnologia` | 0.20 | INNOVACION | 5 | sí |

Alias legibles del Excel → `variable_key`: ver `01_datos_limpios/mapeo_score_postulacion.json`.

**Corrección de datos:** nivel “Líder vinculado fijo o indefinido” = **puntaje 5** (el Excel traía el 5 pegado al texto; se corrige en catálogo).

---

## 3. Descarte (compuerta binaria)

Evaluar **todas** las reglas; si **alguna** falla → `passed=false`, listar `failed_rules[]`.

| rule_id | Criterio PPT | Campo(s) | Condición de DESCARTE |
|---------|--------------|----------|------------------------|
| `D01_sin_vinculo` | Sin vínculo con la universidad | `vinculo_universidad` | puntaje **= 0** (NO vinculado) |
| `D02_solo_idea` | Solo ideas/conceptos | `prototipos` | puntaje **= 0** (Idea o concepto teórico) |
| `D03_operacion_gt_3a` | >3 años operación comercial | `anos_operacion_comercial` | valor **> 3** |
| `D04_sin_base_tech` | Sin desarrollo ni adaptación | `desarrollo_tecnologico` + `adopcion_tecnologia` + `tipo_postulacion` | ver abajo |

### D04 — tabla verdad (única)

| tipo_postulacion | adopcion_tecnologia.points | ¿D04 descarte? |
|------------------|----------------------------|----------------|
| `desarrollo_tecnologico` | cualquiera | **No** |
| `desarrollo_tecnologico_salud` | cualquiera | **No** |
| `adaptacion_tecnologica` | **0** | **Sí** |
| `adaptacion_tecnologica` | &gt; 0 | **No** |
| `null` | — | Error de validación (no submit) |

### Rúbrica `grupo_investigacion` (corregida v1.1)

| Categoría | Points |
|-----------|--------|
| No pertenece | 0 |
| C | 2 |
| B | 3 |
| A | 4 |
| **A1** | **5** |

*(El Excel original invertía A1&lt;C; la auditoría lo corrigió: A1 es la categoría más alta MinCiencias.)*

### Campo nuevo de producto (obligatorio en form)

| Campo | Tipo | Por qué |
|-------|------|---------|
| `anos_operacion_comercial` | number ≥ 0 | El PPT exige el filtro y no existía en el Excel |
| `tipo_postulacion` | enum | Enruta IRL y D04 |
| `sector_id` | de listas | Salud → posible RRL |

---

## 4. Tipo de postulación e IRL

| tipo_postulacion | Dimensiones IRL a pedir/guardar |
|------------------|----------------------------------|
| `desarrollo_tecnologico` | TRL, BRL, IPRL, MRL, FRL, TERL |
| `desarrollo_tecnologico_salud` | TRL, BRL, IPRL, MRL, FRL, TERL, **RRL** |
| `adaptacion_tecnologica` | BRL, IPRL, MRL, FRL, TERL (**sin TRL**) |

Regla de ayuda UX (no automática forzada): si `sector_id` es “Salud y ciencias de la vida” y tipo es desarrollo → sugerir `desarrollo_tecnologico_salud`.

Cada dimensión IRL en submit:

- `self_level` (entero en rango de la dimensión)  
- `self_justification` (texto, obligatorio si hay level)

La IA **no** escribe el score. Solo puede rellenar campos sugeridos en informe aparte.

---

## 5. Salida del motor (contrato JSON)

```json
{
  "rules_version": "motor_v1.1",
  "discard": {
    "passed": true,
    "failed_rules": []
  },
  "tipo_postulacion": "desarrollo_tecnologico",
  "score": {
    "total_0_1": 0.72,
    "total_0_100": 72.0,
    "bloques": {
      "EQUIPO": 0.80,
      "MODELO": 0.70,
      "INNOVACION": 0.66
    },
    "line_items": [
      {
        "variable_key": "nivel_educativo",
        "points": 5,
        "max_points": 5,
        "weight": 0.25,
        "weight_effective": 0.25,
        "normalized": 1.0,
        "contribution": 0.25,
        "block": "EQUIPO",
        "skipped_optional": false
      }
    ]
  },
  "irl_dims_aplicables": ["TRL", "BRL", "IPRL", "MRL", "FRL", "TERL"]
}
```

Si `discard.passed === false`:

- `score` puede ser `null` o calcularse en modo “shadow” **solo para admin** (flag `compute_score_if_discarded: false` por defecto en prod).  
- Producto real: **no mostrar score de selección** al postulante descartado; solo motivos.

---

## 6. Casos de prueba mínimos (QA)

| ID | Entrada clave | Esperado |
|----|---------------|----------|
| T1 | vinculo = 0 | discarded D01 |
| T2 | prototipos = 0 | discarded D02 |
| T3 | anos_operacion = 4 | discarded D03 |
| T4 | adaptacion + adopcion = 0 | discarded D04 |
| T5 | desarrollo válido, todos max | score_total ≈ 1.0 |
| T6 | grado_innovacion vacío | bloque INNOVACION renormaliza sin esa var |
| T7 | tipo salud | irl incluye RRL |
| T8 | tipo adaptacion | irl sin TRL |

---

## 7. Qué queda fuera del motor

- Generación de informes con LLM  
- Override manual del evaluador (capa admin, con audit log)  
- Notificaciones email  

Esas capas consumen la salida del motor; no la alteran sin traza.
