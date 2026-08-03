# Explicación simple: motor, backend y el resto

Documento **en lenguaje claro**. Sin jerga innecesaria.  
Si solo lees un archivo de arquitectura, lee **este**.

---

## 1. Las tres capas (como un restaurante)

Imagina la herramienta como un restaurante:

| Capa | Analogía | En el proyecto | Qué hace la gente |
|------|----------|----------------|-------------------|
| **Frontend** | La sala, el menú, lo que se ve | Web en React (hero, formulario, botones) | Mira, hace clic, llena el form, se inscribe |
| **Backend** | La cocina + el sistema de pedidos | API + lógica + base de datos | Recibe la postulación, calcula, guarda, decide reglas |
| **Motor de evaluación** | La receta exacta del chef (cómo se cocina el plato) | Reglas: descarte, score, IRL | No es una pantalla: es **cómo se calcula** si pasas o no y con qué puntaje |

- El **frontend** no debería “inventar” el puntaje final solo en el navegador (se puede mostrar un preview, pero la verdad la firma la cocina).  
- El **backend** guarda todo y ejecuta el motor.  
- El **motor** es el reglamento de la convocatoria metido en código/reglas.

```text
[Persona] → Frontend (web) → Backend (servidor) → Base de datos
                                ↓
                         Motor de evaluación
                         (descarte + score + IRL)
```

---

## 2. ¿Qué es la “SPEC del motor”?

**SPEC** = especificación escrita: las reglas **cerradas** antes de programar, para que nadie invente números.

El motor tiene **tres puertas en orden**:

### Puerta 1 — Descarte (sí o no)

Antes de puntuar, se pregunta: ¿esta postulación **ni siquiera entra**?

Ejemplos del PPT:

1. Sin vínculo con la universidad  
2. Solo idea (sin prototipo / PMV)  
3. Más de 3 años con operación comercial  
4. Sin desarrollo ni adaptación tecnológica  

Si falla **cualquiera** → estado **Descartada**, con el motivo visible.  
**No importa** si el resto del form era brillante: no pasa.

La SPEC del motor debe decir, de forma exacta:

- Qué **pregunta del formulario** alimenta cada filtro  
- Qué **respuesta** dispara el descarte  
- Qué pasa si falta un dato  

*Hoy tenemos los criterios en texto; falta el “mapa” pregunta → regla (eso es parte de la spec).*

---

### Puerta 2 — Score DeepTech (puntaje con pesos)

Si **no** fue descartada, se calcula un **puntaje desglosado**.

El Excel no es un solo número mágico. Hay **3 bloques**:

| Bloque | Ejemplo de cosas que mide | Los pesos dentro del bloque suman |
|--------|---------------------------|-----------------------------------|
| **Equipo** | Nivel educativo, grupo de investigación, vínculo UR, experiencia… | 100% del bloque Equipo |
| **Modelo de negocio** | Problema, propuesta de valor, prototipo, competencia… | 100% del bloque Modelo |
| **Innovación / tecnología** | ¿Hay innovación?, grado, madurez, adopción tech… | 100% del bloque Innovación |

Cada variable tiene **niveles** (ej. 0, 2, 3, 5).  
Cada variable tiene un **peso** (ej. 0.25 = 25% de su bloque).

**Lo que aún hay que decidir en la SPEC (por eso no se programa aún):**

1. **¿Cómo se unen los 3 bloques en un solo número final?**  
   - ¿Promedio de los tres?  
   - ¿Equipo 30% + Modelo 40% + Innovación 30%?  
   - El Excel **no lo dice**; hay que documentar la decisión.

2. **¿Cómo se normaliza?**  
   - Opción A: `(puntos / máximo de esa variable) × peso`  
   - Opción B: `puntos × peso` en crudo  
   - Hay que elegir **una** y usarla siempre.

3. **Preguntas opcionales**  
   - Si no contesta “grado de innovación” (que pesa mucho en su bloque), ¿se pone 0, se ignora y se repartes los pesos, o se obliga?  
   - Sin esta regla, dos programadores harán cosas distintas.

4. **Nombres de variables**  
   - En el score dice una cosa y en el formulario otra (mismo concepto, distinto nombre).  
   - Hace falta una **tabla de equivalencias** (mapeo).

**Salida del motor (score):**

- Puntaje por bloque  
- Puntaje total (según la fórmula acordada)  
- Lista línea a línea: variable → puntos → peso → contribución  
- Versión de las reglas usadas (para no cambiar la historia si mañana cambian pesos)

---

### Puerta 3 — Diagnóstico IRL (madurez)

No es el mismo que el score. Es un **perfil de madurez** por dimensiones (tipo KTH):

| Código | En criollo |
|--------|------------|
| TRL | Qué tan lista está la **tecnología** |
| BRL | Qué tan listo el **negocio** |
| IPRL | **Propiedad intelectual** |
| MRL | **Mercado** |
| FRL | **Finanzas** |
| TERL | **Equipo** |
| RRL | **Regulación** (salud / INVIMA, etc.) |

Según el **tipo** de postulación:

| Tipo | Dimensiones |
|------|-------------|
| Desarrollo tecnológico | TRL + BRL + IPRL + MRL + FRL + TERL |
| Sector salud | Las de arriba **+ RRL** |
| Adaptación tecnológica | Todas menos **TRL** |

La persona se autoevalúa (nivel + justificación).  
La IA puede **contrastar** (¿el texto del form respalda ese nivel?).  
La SPEC dice: qué dims aplican, escalas, y qué hace la IA (sugerir, no sustituir sin rastro).

---

## 3. ¿Qué es el backend? (dónde se guarda todo)

El backend es **todo lo que no se ve**, en un servidor:

1. **Cuentas** — quién es postulante, evaluador o admin.  
2. **Postulaciones** — borrador y envíos.  
3. **Respuestas** — cada campo del formulario.  
4. **Archivos** — fotos/PDF del prototipo (en un “disco en la nube”, no en el Excel).  
5. **Resultados** — descarte, score, IRL, análisis IA.  
6. **Historial** — quién cambió qué (auditoría).

### ¿Dónde se aloja si lo pone la Universidad del Rosario?

Opciones reales (no hay que elegir ya para seguir documentando):

| Camino | En simple | Cuándo |
|--------|-----------|--------|
| **MVP rápido** | Web en Vercel + datos en Supabase (Postgres) | Para construir y probar ya |
| **Institucional** | Azure + login Microsoft de la UR | Cuando TI diga “producción oficial” |
| Dominio | Idealmente algo como `deeptech.urosario.edu.co` | Lo da la universidad |

**Flujo de una persona real:**

```text
1. Entra a la web (frontend)
2. Se registra / inicia sesión
3. Llena el formulario (se guarda en la base de datos, no en tu PC)
4. Envía
5. El backend corre el motor:
      descarte → score → IRL (+ IA en segundo plano)
6. Ella ve el resultado en la web
7. Transferencia/evaluación ve el panel admin con todas las postulaciones
```

**Importante:** los JSON de `01_datos_limpios/` son el **reglamento** (qué preguntar, pesos, dims).  
La **base de datos** es el **expediente de cada persona** (sus respuestas y resultados).  
No son lo mismo.

---

## 4. ¿Qué es el frontend? (lo que se ve)

- Landing con el **hero** (efecto spotlight del prompt Lithos).  
- Video ADN del repo = **referencia visual** (tú ya lo tienes; no hay que generarlo).  
- Formulario de postulación.  
- Pantalla de resultados.  
- Login / registro.

El prompt exacto del efecto está en:

`03_prompts/PROMPT_FRONTEND_HERO.md`

El video está en:

`02_recursos/video/Video_genetic_editing_DNA_modified_202608022104.mp4`

---

## 5. Orden de las piezas (para no confundirse)

| Orden | Pieza | ¿Lista? | Para qué |
|-------|-------|---------|----------|
| 1 | Datos limpios (JSON del Excel/PPT) | ✅ | Reglamento de negocio |
| 2 | Prompt frontend hero | ✅ | Cómo se ve el landing |
| 3 | Arquitectura backend (propuesta) | ✅ documentada | Dónde viven datos e inscripciones |
| 4 | **SPEC del motor** | ✅ `motor_v1.1` + `rules_catalog_motor_v1.json` | Reglas exactas de cálculo |
| 5 | Producción cloud | ✅ Supabase + Vercel (docs + SQL) | No backend en tu PC |
| 6 | Código de la app | 🚫 pendiente de orden “implementa” | Ver `GO_IMPLEMENTACION.md` |

La SPEC del motor **ya está cerrada** (post-auditoría). Falta **construir y desplegar** con cuentas cloud.

---

## 6. Glosario de 30 segundos

| Palabra | Significado simple |
|---------|-------------------|
| **Frontend** | La página web que ves |
| **Backend** | Servidor + base de datos + API |
| **Motor** | Reglamento automático de evaluación |
| **SPEC** | Documento de reglas antes de programar |
| **Descarte** | Filtro de entrada (sí/no) |
| **Score** | Puntaje ponderado por bloques |
| **IRL** | Perfil de madurez multi-dimensional |
| **Postulación** | El formulario enviado por un equipo |
| **JSON limpios** | El Excel/PPT traducidos para la IA y el código |

---

## 7. Qué falta escribir en la SPEC del motor (lista corta)

Cuando digamos “hagamos la SPEC del motor”, el archivo responderá solo esto:

1. Tabla descarte: regla → campo del form → valor que descarta.  
2. Tabla mapeo: nombre en score ↔ nombre en formulario.  
3. Fórmula de cada bloque (normalización sí/no).  
4. Cómo se combinan los 3 bloques en un total.  
5. Qué hacer con opcionales vacías.  
6. Cómo se elige el tipo (desarrollo / salud / adaptación) y el set IRL.  
7. 3–5 ejemplos numéricos de prueba (“si contesta X, el score debe ser Y”).

Hasta que eso exista, **no se construye el backend del motor ni se fía el front del puntaje oficial**.

---

## 8. Dónde está cada documento (si quieres profundizar)

| Si quieres… | Abre… |
|-------------|--------|
| Esta explicación simple | `04_plan/EXPLICACION_SIMPLE_MOTOR_Y_BACKEND.md` |
| Backend con detalle técnico | `04_plan/ARQUITECTURA_BACKEND_Y_HOSTING.md` |
| Tablas de datos | `04_plan/MODELO_DATOS_RESUMEN.md` |
| Prompt hero (mecánica Lithos + adaptación UR) | `03_prompts/PROMPT_FRONTEND_HERO.md` |
| UX más amplia (pantallas, wizard) | `04_plan/SPEC_FRONTEND_UX.md` |
| Reglamento de negocio (JSON) | `01_datos_limpios/` |
| Video ADN | `02_recursos/video/` |
