# Modelo de datos — resumen visual

Complemento de `ARQUITECTURA_BACKEND_Y_HOSTING.md`. Vista rápida para alinear front y back.

---

## Diagrama entidad-relación (simplificado)

```text
┌──────────┐     1:N     ┌──────────────┐
│   User   │────────────▶│ Application  │
│ roles    │             │ status, tipo │
└──────────┘             └──────┬───────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                    │
           ▼                    ▼                    ▼
   ApplicationAnswer    ApplicationFile      DiscardResult
   (variable_key,       (storage_key)        (passed, rules)
    value, points)
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
              ScoreResult              IrlAssessment
              (blocks, total,          (dim, levels)
               line_items)
                    │
                    ▼
              AiAnalysisJob
```

---

## Ciclo de vida de la postulación

```text
draft ──submit──▶ submitted ──engine──▶ discarded
                         │
                         └──engine──▶ scored ──review──▶ accepted
                                              │         waitlisted
                                              └────────▶ rejected
```

---

## Quién escribe qué

| Dato | Escrito por |
|------|-------------|
| Respuestas formulario | Postulante (API) |
| Archivos | Postulante → storage |
| Descarte / score | **Motor backend** (no el browser) |
| IRL auto | Postulante |
| IRL IA sugerido | Worker IA |
| Decisión final programa | Evaluador / admin |
| Catálogos de reglas | Deploy / admin (desde `01_datos_limpios`) |

---

## Relación con JSON limpios

| JSON en `01_datos_limpios` | Tabla / uso runtime |
|----------------------------|---------------------|
| `postulacion.json` | Define campos → `ApplicationAnswer.variable_key` |
| `score_deeptech.json` | Pesos → `ScoreResult.line_items` |
| `diagnostico_kth_irl.json` | Dimensiones → `IrlAssessment` |
| `proceso_seleccion_deeptech.json` | Descarte + tipo → `DiscardResult` + `Application.tipo` |
| `listas_desplegables.json` | Catálogo facultad/sector |
