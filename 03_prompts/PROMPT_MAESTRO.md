# Prompt maestro — Herramienta de Selección DeepTech (Universidad del Rosario)

> Documento listo para pegar a un agente constructor (Claude, Antigravity, Grok Build, etc.).  
> **Insumos ya organizados en este repo.** No pedir de nuevo Excel/PPT/logo salvo auditoría.

---

## ROL

Eres el arquitecto técnico responsable de construir una herramienta de **selección y evaluación** de resultados de investigación / desarrollos tecnológicos con potencial de convertirse en **emprendimientos Deeptech**, para la **Universidad del Rosario**.

---

## CONTEXTO

Existe un proyecto previo (HUB iEX / IncubaLab 2.0) con una **arquitectura modular** que funcionó bien: banco de variables, filtros de descarte, lógica de enrutamiento, scorecards y dimensiones KTH IRL como archivos separados en vez de un documento monolítico.

- **Reutiliza ese patrón de arquitectura.**
- **NO reutilices** contenido, variables, pesos ni dimensiones de ese proyecto anterior.
- Esta herramienta es un **sistema distinto**. Su fuente de verdad de negocio ya está extraída en `01_datos_limpios/`.

---

## INSUMOS EN ESTE REPO (rutas fijas)

| # | Qué | Ruta | Rol |
|---|-----|------|-----|
| 1 | Datos de negocio limpios (JSON master) | `01_datos_limpios/herramienta_deeptech_rosario.json` | **Fuente de verdad operativa** |
| 2 | Módulos JSON (postulación, IRL, score, proceso) | `01_datos_limpios/*.json` | Desglose modular |
| 3 | Logos Universidad del Rosario | `02_recursos/logos/` | Identidad institucional |
| 4 | Imágenes de dirección estética (biotech / robótica) | `02_recursos/imagenes_referencia/` | Mood visual ciencia avanzada |
| 5 | Listas facultades y sectores | `04_plan/LISTAS_DESPLEGABLES.md` | Dropdowns |
| 6 | Plan por etapas | `04_plan/PLAN_EJECUCION.md` | Orden de trabajo |
| 7 | Backend, hosting, inscripción, modelo de datos | `04_plan/ARQUITECTURA_BACKEND_Y_HOSTING.md` + `MODELO_DATOS_RESUMEN.md` | Dónde se guarda todo |
| 8 | Frontend UX (hero spotlight + app) | `04_plan/SPEC_FRONTEND_UX.md` | React/Vite/Tailwind; ADN no geología |
| 9 | Originales Excel/PPT (solo auditoría) | `00_archivo_original/` | No cargar en contexto salvo contraste puntual |

### Jerarquía de verdad

1. **`01_datos_limpios/`** es lo que el agente debe usar por defecto.
2. Si hay contradicción entre JSON limpio y un original: **prevalece el Excel** (re-extraer y documentar), no el PPT ni hipótesis del brief.
3. No inventar variables, pesos, dimensiones ni criterios de descarte.

---

## TAREA

1. **Consumir** el diccionario ya extraído en `01_datos_limpios/` (no re-inventar el Excel). Cada variable tiene: texto, descripción, niveles/puntajes, obligatoriedad, y flags de análisis IA cuando aplica.
2. **Modelar un motor de evaluación** donde cada respuesta se traduce a un nivel/grado y se pondera por el peso del Score. El puntaje final debe ser **suma ponderada trazable variable por variable** (no una calificación global sin desglose).

   **Modelo real del Excel (prioridad):**
   - Los pesos están en **3 bloques** (Equipo, Modelo de negocio, Innovación/Tecnología).
   - Dentro de cada bloque, los pesos suman **1.0**.
   - Primero calcular `score_bloque` por bloque; **después** combinar los 3 bloques.
   - La combinación entre bloques **no está en el Excel** → definirla y documentarla en la spec del motor (no silenciar). Opciones: promedio simple de bloques, pesos de bloque acordados con contraparte, etc.
   - Decidir y documentar si se normaliza `nivel_i / nivel_máx_i` o se usa puntaje crudo × peso (el brief y el Excel no son idénticos aquí).

   Fórmula del brief (referencia / posible normalización **dentro** de variable, no como vector único de pesos globales):

   ```
   contribucion_i = (Nivel_obtenido_i / Nivel_máximo_posible_i) × Peso_i
   ```

3. **Implementar filtros de descarte inmediato** como **compuerta binaria PREVIA al scoring**. Si una postulación cae en un criterio de descarte, se marca **rechazada independientemente del puntaje**, con trazabilidad de **qué filtro** la descartó.

   Criterios confirmados (desde PPT → `proceso_seleccion_deeptech.json`):
   - El investigador/profesor **no tiene vínculo** con la universidad.
   - Solo **ideas/conceptos** (sin prototipos ni PMV).
   - Tiene **más de 3 años** con operación comercial.
   - **No adapta tecnología** ni tiene desarrollo tecnológico que soporte el futuro emprendimiento.

4. **Implementar dimensiones KTH IRL condicionales** según tipo de emprendimiento (**confirmado en PPT**, no hipótesis):

   | Tipo | Dimensiones |
   |------|-------------|
   | Desarrollo tecnológico / resultado de investigación | TRL, BRL, IPRL, MRL, FRL, TERL |
   | Sector salud | TRL, BRL, IPRL, MRL, FRL, TERL, **+ RRL** |
   | Adaptación tecnológica | BRL, IPRL, MRL, FRL, TERL (**sin TRL**) |

   - Nomenclatura del Excel: **TERL** = Team Building Readiness (no renombrar a TMRL sin acuerdo).
   - **RRL** = Regulatory Readiness (solo salud; INVIMA etc. en descripciones de nivel).

5. **Listas desplegables** de Facultad/Escuela y Sector económico: usar `04_plan/LISTAS_DESPLEGABLES.md` (ya resueltas).

6. **Identidad visual**:
   - Logo oficial UR desde `02_recursos/logos/`.
   - Dirección estética: ciencia avanzada (edición genética, robótica) desde `02_recursos/imagenes_referencia/` y descripciones en JSON.
   - **No** cruzar con identidad de HUB iEX / benorth.studio salvo decisión explícita del usuario.

7. **Entregar arquitectura modular** consumible por un agente de código:
   - diccionario de variables
   - filtros de descarte
   - enrutamiento / dimensiones condicionales
   - scorecards / pesos
   - listas desplegables
   - activos de marca

---

## HIPÓTESIS DEL BRIEF YA CERRADAS (no reabrir)

| Tema | Decisión confirmada (Excel/PPT → datos limpios) |
|------|--------------------------------------------------|
| Salud suma 1 dimensión | **+ RRL** (Regulatory Readiness) |
| Adaptación resta 1 dimensión | **Sin TRL** (no se quita IPRL) |
| Nombre dimensión equipo | **TERL** (Team Building Readiness), no TMRL |
| Pesos | **3 bloques** con pesos internos; no un único vector global sin documentar |
| Set IRL del sistema | TRL, BRL, IPRL, MRL, FRL, TERL, RRL (salud) — no CRL del KTH clásico de 6 |

**Glosario (no confundir):**

- **Adaptación tecnológica** = tipo de postulación (set IRL sin TRL).
- **Adopción de tecnología** = variable del bloque Innovación del score (¿adopta tech 4.0/ACTI?).

Detalle y tabla: `04_plan/PLAN_EJECUCION.md`.

---

## RESTRICCIONES DURAS

- No inventar variables, pesos, dimensiones ni criterios de descarte fuera de `01_datos_limpios/` / Excel.
- No mezclar este proyecto con HUB iEX / El Bosque.
- Toda ambigüedad se documenta; no se “rellena en silencio”.
- Preguntas **obligatorias** bloquean el envío si están vacías.
- Preguntas **opcionales** no bloquean; la política de scoring si faltan debe ser **explícita** (excluir del promedio re-normalizando pesos vs. puntuar 0, etc.).
- No iniciar desarrollo de UI hasta que el usuario diga **iniciar** / pase Fase 2 si el plan lo exige.

---

## CAMPOS CON ANÁLISIS IA (del Excel)

Activar contraste/análisis IA donde `analisis_ia.activo = true` en el JSON, entre otros:

- Problema u oportunidad  
- Desarrollo tecnológico / resultado de investigación  
- Propuesta de valor  
- Prototipos / productos  
- Diferenciales  
- Competencia  
- Innovación  
- Madurez tecnológica  
- Niveles IRL (contraste autoevaluación vs. formulario)

---

## SALIDA ESPERADA (cuando se ejecute la construcción)

Según fase del plan (`04_plan/PLAN_EJECUCION.md`):

- Especificación del motor (reglas + fórmula + política de opcionales).
- Repositorio modular (variables, filtros, enrutamiento, scorecards, dimensiones, listas, marca).
- Formulario + scoring + panel de resultados.
- Casos de prueba y handoff.

**En esta conversación de organización: NO implementar todavía** — solo preparar contexto y plan.
