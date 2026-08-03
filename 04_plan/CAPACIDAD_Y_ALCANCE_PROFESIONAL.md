# ¿Qué tan profesional puede quedar este proyecto? (evaluación realista)

> Respuesta directa, sin marketing.  
> No se ha construido la app aún; esto calibra expectativas.

---

## 1. Respuesta corta

| Pregunta | Respuesta |
|----------|-----------|
| ¿Se puede lograr un producto **profesional** (usable en convocatoria real)? | **Sí**, con el alcance bien cortado y las specs cerradas. |
| ¿Puede verse y sentirse a nivel “producto de transferencia universitaria”? | **Sí** — landing con efecto premium + form serio + informe IA. |
| ¿Queda “perfecto al 100% sin decisiones tuyas/UR”? | **No** — faltan: formula del score, OK de hosting/privacidad, textos legales, proveedor de IA aprobado. |
| ¿Lo más frágil es la IA o el motor? | El **motor y los datos** (pesos, opcionales, descarte). La IA es la capa de narrativa. |

---

## 2. Qué significa “profesional” aquí

Un resultado profesional **no** es solo un hero bonito. Es:

| Capa | Criterio profesional | Dificultad |
|------|----------------------|------------|
| UX / marca UR | Logo, color, hero, form claro en móvil | Media |
| Flujo de inscripción | Cuenta, borrador, envío, estados | Media |
| Motor de evaluación | Trazable, testeado, sin números inventados | Media-alta (spec primero) |
| Informes IA | Útiles, anclados al score, sin alucinaciones graves de cifras | Media (con buen prompt + schema) |
| Seguridad / roles | Postulante ≠ evaluador; keys solo servidor | Media |
| Deploy / operación | Staging + prod, backups, env vars | Media (depende de TI UR) |
| Cumplimiento datos | Aviso privacidad, retención | Depende de la universidad |

Con el material que **ya tienes** (Excel→JSON, proceso, logos, video, prompts), el techo profesional es **alto** si no se improvisa el score.

---

## 3. Capacidad de ejecución (con Grok Build / este flujo)

### Lo que se puede entregar con alta confianza

- Estructura modular de datos y motor (reglas en archivos/JSON).  
- Frontend React + Tailwind a nivel producto (hero tipo tu prompt + wizard).  
- Backend API + Postgres + auth + storage de archivos.  
- Integración LLM **server-side** (OpenAI / DeepSeek / xAI) para informes.  
- Panel básico de admin y export.  
- Documentación de handoff.

### Lo que depende de ti / de la UR (no del modelo)

- Aprobar fórmula entre bloques del score.  
- Aprobar proveedor de IA y privacidad.  
- Dominio, SSO, correo institucional.  
- Textos legales y nombre final del producto.  
- Casos reales de prueba de convocatorias pasadas (si existen).  
- Tiempo de revisión humana de cada fase.

### Riesgos si se “corre demasiado”

| Riesgo | Efecto |
|--------|--------|
| Programar sin SPEC del motor | Scores distintos cada deploy; pierde credibilidad ante la UR |
| Meter la API key en el front | Filtración y costos descontrolados |
| Dejar que la IA “ponga el puntaje” | No auditable; conflicto con el Excel |
| Scope infinito (CRM, chat, app móvil nativa…) | No se entrega a tiempo |

---

## 4. Niveles de entrega (para planear)

### Nivel A — Demo profesional (MVP fuerte)

- Landing con hero (tu mecánica + assets ADN/video).  
- Registro + formulario multi-paso + submit.  
- Motor descarte + score + IRL (versión 1 de la spec).  
- Informe IA v1 (un proveedor).  
- Panel admin simple.  
- Deploy en Vercel + Supabase (o similar).

**Sirve para:** mostrar a contraparte, piloto controlado.

### Nivel B — Convocatoria real

Nivel A +  

- Privacidad y consentimiento.  
- Roles evaluador bien cerrados.  
- Overrides + auditoría.  
- Versionado de reglas.  
- Hosting alineado a TI (o contrato cloud aceptado).  
- QA con casos reales.

### Nivel C — Institucional pleno

Nivel B + SSO Entra ID, Azure, dominio `urosario.edu.co`, SLAs, Power BI, etc.

**Recomendación:** apuntar a **Nivel A sólido → B**, no a C en el primer sprint.

---

## 5. Qué tan “capaz” soy en este setup

De forma honesta:

- **Diseño + datos + plan:** ya avanzado y por encima del promedio de un brief suelto.  
- **Implementación full-stack con IA:** viable y habitual en este tipo de herramienta **si** el motor está especificado.  
- **Lo que no garantizo solo:** aprobaciones legales de la UR, presupuesto cloud, ni que DeepSeek sea aceptable para datos de investigación sin revisión jurídica.  
- **Calidad profesional:** alcanzable en UI y en lógica **si** no se salta la Fase de motor y se prueba con 5 casos sintéticos antes de datos reales.

En resumen: **sí me creo el proyecto a nivel profesional de producto universitario de transferencia**, no como “PowerPoint con formulario de Google”.  
La condición es trabajar por capas: **reglas → backend → front → IA de informes**, no al revés.

---

## 6. Orden recomendado (sigue sin construir hasta que digas)

1. Cerrar **SPEC del motor** (fórmulas + descarte + opcionales).  
2. Cerrar **proveedor de IA** preferido para MVP (OpenAI / DeepSeek / xAI) + reglas de qué datos van al prompt.  
3. Scaffold app (cuando ordenes): monorepo o `apps/web` + `apps/api`.  
4. Motor + API de postulaciones.  
5. Frontend hero + wizard.  
6. Jobs de informe.  
7. QA + handoff.

Documentos ya listos para esa ruta:

| Tema | Archivo |
|------|---------|
| Backend paso a paso | `COMO_FUNCIONA_BACKEND.md` |
| IA e informes | `PLAN_IA_INFORMES.md` |
| Explicación simple | `EXPLICACION_SIMPLE_MOTOR_Y_BACKEND.md` |
| Hosting / datos | `ARQUITECTURA_BACKEND_Y_HOSTING.md` |
| Prompt hero | `../03_prompts/PROMPT_FRONTEND_HERO.md` |
| Datos de negocio | `../01_datos_limpios/` |
