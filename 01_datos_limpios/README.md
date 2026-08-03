# `01_datos_limpios` — Contexto IA (única fuente operativa)

Esta carpeta es el **contexto limpio** que debe cargar un agente para entender reglas de negocio, scoring e IRL.

**No** incluyas aquí el Excel ni el PowerPoint originales (`00_archivo_original/`).

---

## Archivo recomendado (todo-en-uno)

| Archivo | Uso |
|---------|-----|
| **`herramienta_deeptech_rosario.json`** | Master: postulación + IRL + score + proceso + imágenes. Preferido para system/context. |

## Módulos (si prefieres cargar por partes)

| Archivo | Contenido |
|---------|-----------|
| `postulacion.json` | Formulario: variables, niveles/puntajes, obligatorio/opcional, flags de análisis IA |
| `diagnostico_kth_irl.json` | Dimensiones TRL, BRL, IPRL, MRL, RRL, FRL, TERL + descripción de cada nivel |
| `score_deeptech.json` | Pesos por bloque (Equipo, Modelo de negocio, Innovación/Tecnología) |
| `proceso_seleccion_deeptech.json` | Flujo, filtros de descarte, tipos de postulación, dimensiones condicionales, Mermaid |
| `imagenes_descripciones.json` | Alt text, uso y rutas de logos e imágenes de referencia |
| `listas_desplegables.json` | Facultades (9) y sectores económicos (17) — copia operativa del plan |

## Diagramas (referencia humana / UI)

| Archivo | Contenido |
|---------|-----------|
| `diagrama_proceso_deeptech.png` | Flujo visual |
| `diagrama_proceso_deeptech.html` | Flujo en HTML |
| `diagrama_proceso_deeptech.mmd` / `.md` | Mermaid |

---

## Dimensiones KTH IRL (confirmadas desde el PPT + Excel)

| Tipo de postulación | Dimensiones |
|---------------------|-------------|
| Desarrollo tecnológico / resultado de investigación | TRL, BRL, IPRL, MRL, FRL, TERL |
| Desarrollo tecnológico **sector salud** | Las anteriores **+ RRL** |
| Adaptación tecnológica | BRL, IPRL, MRL, FRL, TERL (**sin TRL**) |

> Nota: la nomenclatura del Excel usa **TERL** (Team Building Readiness), no TMRL. No renombrar sin acuerdo con la contraparte.

---

## Fórmula de score (a validar en motor — Fase 2)

Referencia del brief:

```
Puntaje_final = Σ [ (Nivel_obtenido_i / Nivel_máximo_posible_i) × Peso_i ]
```

En el Excel, los pesos están por **bloque** (Equipo, Modelo de negocio, Innovación) y suman 1.0 **dentro de cada bloque**. La forma de combinar los 3 bloques entre sí **no está explícita en el Excel** → documentar decisión en Fase 2 (no inventar en silencio).

---

## Cómo evaluar (lógica resumida)

1. Aplicar **filtros de descarte** (binario, previo al score).
2. Clasificar **tipo** → set de dimensiones IRL.
3. Puntuar variables con niveles según postulación.
4. Aplicar pesos del score.
5. Autoevaluación IRL + contraste IA vs. texto del formulario.
6. Emitir: score desglosado, radar IRL, brechas, recomendaciones.
