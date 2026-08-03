# Validación multiagente — ¿Listo para iniciar?

**Fecha:** 2026-08-02  
**Alcance:** organización del repo + prompt + plan + datos limpios.  
**No se implementó la herramienta** (formulario/app).

---

## Agentes

| Agente | Enfoque | Veredicto |
|--------|---------|-----------|
| Plan / readiness | Carpetas, prompt, gates de fases | **`LISTO_PARA_FASE_1_2`** (no Fase 5) |
| Explore / datos | Completitud del JSON para motor | **Entender dominio: sí · Motor determinista sin decisiones: no** |
| Plan / alineación brief | Prompt y plan vs brief original | **`PARCIAL` (alto)** — reglas OK; fricciones de proceso |

---

## Veredicto consolidado

### `LISTO_PARA_FASE_1_2`

| Pregunta | Respuesta |
|----------|-----------|
| ¿Carpetas claras (contexto solo en datos limpios)? | **Sí** |
| ¿Prompt alineado con Excel/PPT reales (descarte, +RRL, −TRL, TERL)? | **Sí** |
| ¿Fase 0 (insumos) hecha? | **Sí** |
| ¿Listo para codificar la app (Fase 5)? | **No** |
| ¿Se puede planear y especificar el motor ya? | **Sí** |

**Resumen en una frase:** el proyecto está **bien organizado y listo para auditoría + spec del motor**; **no** está listo para desarrollar la app sin inventar reglas en silencio.

---

## Lo que está bien

1. Separación `00_archivo_original` vs `01_datos_limpios` vs `02_recursos` vs `03_prompts` vs `04_plan`.
2. JSON con postulación (30 vars), score (3 bloques), IRL (7 dims), proceso (descarte + tipos).
3. Hipótesis del brief **corregidas** con datos reales:
   - Salud → **+ RRL** (no genérico).
   - Adaptación → **sin TRL** (no sin IPRL).
   - Equipo IRL → **TERL** (no TMRL).
4. Listas facultades (9) y sectores (17) en `04_plan/`.
5. Prompt y plan **no autorizan** desarrollo hasta Fase 2 + orden del usuario.

---

## Gaps que bloquean Fase 5 (desarrollo)

| # | Gap | Severidad |
|---|-----|-----------|
| 1 | No existe `SPEC_MOTOR_EVALUACION.md` (fórmula entre bloques, escala final) | CRITICAL |
| 2 | Claves `score` ≠ claves `postulacion` sin tabla de mapeo | CRITICAL |
| 3 | Fórmula ambigua: normalizar por max vs puntaje crudo × peso | CRITICAL |
| 4 | Descarte en prosa, no reglas ejecutables; “>3 años comercial” sin campo | CRITICAL |
| 5 | `GRADO_DE_INNOVACIÓN` opcional con peso **0.35** sin política de missing | CRITICAL |
| 6 | `puntaje: null` en vínculo “fijo/indefinido” (probable error extracción) | CRITICAL |
| 7 | Sin campo “tipo de postulación” en el formulario | MAJOR |
| 8 | Listas facultad/sector fuera de `01_datos_limpios` | MAJOR |
| 9 | Stack/UI y orden explícita de “iniciar” no acordados | GOVERNANCE |

---

## Gaps Fase 1–2 (no bloquean planear)

- Auditoría fina JSON vs Excel (typos).
- Variables con niveles fuera del score (clientes, ventas) — definir rol.
- Schema de entrada IRL (autoevaluación + justificación).
- Alinear `campos_con_ia` del proceso con claves reales.
- Tokens visuales (Fase 4).
- Actualizar `scripts/build_ai_json.py` a rutas nuevas.

---

## Top 5 acciones antes de codificar

1. Escribir **`04_plan/SPEC_MOTOR_EVALUACION.md`** (bloques, normalización, opcionales, descarte ejecutable, umbrales).
2. Crear **`01_datos_limpios/mapeo_score_postulacion.json`** (join score ↔ formulario).
3. Modelar **tipo de postulación** + reglas IRL en datos (no solo Mermaid).
4. Corregir **puntaje null** del vínculo fijo (vs Excel) y política de opcionales.
5. Definir **stack MVP** + 3–5 casos de prueba sintéticos; luego orden de “iniciar”.

---

## Riesgos destacados

| Riesgo | Mitigación |
|--------|------------|
| Mezclar variables de HUB iEX / El Bosque | Solo patrón modular; fuente = `01_datos_limpios/` |
| Inventar pesos entre bloques | Documentar decisión en spec; no silenciar |
| Opcional “grado de innovación” 35% | Política explícita (0 / renormalizar / exigir) |
| Descarte “>3 años” sin dato | Nuevo campo o excluir del MVP documentado |
| Agente implementa fórmula “plana” del brief | Prompt: priorizar modelo de 3 bloques |

---

## Cómo usar el contexto de aquí en adelante

```
Contexto IA de negocio:   01_datos_limpios/
Assets visuales:          02_recursos/
Instrucciones construir:  03_prompts/PROMPT_MAESTRO.md
Plan:                     04_plan/
Originales (auditoría):   00_archivo_original/   ← no cargar por defecto
```

---

## Firma de debate

| Rol | Conclusión |
|-----|------------|
| Readiness | LISTO_PARA_FASE_1_2 |
| Datos | No motor sin spec + mapeo |
| Alineación brief | PARCIAL (reglas alineadas) |

**Siguiente paso recomendado (cuando el usuario lo pida):** Fase 1–2 (auditoría + spec del motor).  
**No iniciar Fase 5** hasta cerrar el checklist de `04_plan/PLAN_EJECUCION.md`.
