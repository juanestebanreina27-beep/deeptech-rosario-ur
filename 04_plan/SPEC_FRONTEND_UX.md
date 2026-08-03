# Spec frontend / UX — DeepTech Universidad del Rosario

> **Estado:** brief de implementación (sin código aún).  
> **Stack acordado como intención:** React 18 + TypeScript + Vite + Tailwind CSS + lucide-react.  
> **Referencia mecánica:** hero “Lithos” (spotlight cursor + doble imagen).  
> **Contenido visual:** ciencia avanzada DeepTech (ADN / edición genética + robótica), **no** geología.

---

## 1. Objetivo de producto (UI)

Experiencia web que permita:

1. **Atraer** (landing con hero de impacto institucional + deeptech).  
2. **Inscribirse / entrar** (Sign up / Login).  
3. **Postular** (formulario multi-paso guiado por `01_datos_limpios`).  
4. **Ver resultado** (descarte, score desglosado, radar IRL, insights IA).  
5. **Administrar** (solo roles evaluador/admin — rutas separadas).

El front es **cliente de la API**. El score oficial **no** se inventa solo en el browser.

---

## 2. Identidad: qué se toma de “Lithos” y qué se cambia

| Del brief Lithos (mantener mecánica) | Adaptación DeepTech UR |
|--------------------------------------|------------------------|
| Full-screen dark hero | Sí — `h-screen` / `100dvh`, `bg-black` |
| Spotlight que revela 2ª imagen | Sí — misma lógica canvas mask |
| React 18 + TS + Vite + Tailwind + lucide | Sí |
| Inter + Playfair Display italic | **Revisar** con marca UR (ver §4) |
| Nav fija con pill central | Sí — labels del programa |
| Animaciones hero-reveal / zoom | Sí |
| Copy geología + naranja `#e8702a` | **No** — copy DeepTech + rojo UR |
| Imágenes Higgs geología | **No** — ADN + (opcional) robótica de `02_recursos` |
| Marca “Lithos” | **Universidad del Rosario / DeepTech** |

---

## 3. Assets del hero (en lugar de Lithos)

### 3.1 Capas de imagen

| Capa | Rol | Fuente recomendada |
|------|-----|--------------------|
| `BG_IMAGE_1` (base) | Atmósfera / contexto | Versión “ambiente lab / abstract science” **o** la robótica maker (`02_recursos/imagenes_referencia/slide2_img2.jpg`) con overlay oscuro |
| `BG_IMAGE_2` (reveal) | “Descubrimiento” bajo el spotlight | **ADN / edición genética** (`02_recursos/imagenes_referencia/slide1_img1.jpg`) |

**Intención creativa:** el cursor “revela” la capa de ciencia profunda (ADN), metáfora de *descubrir el potencial deeptech* bajo la superficie del proyecto.

### 3.2 Preparación de assets (Fase 4, antes de codificar)

- [ ] Exportar/copiar a `02_recursos/hero/` versiones **optimizadas WebP** (1920px ancho, q~85).  
- [ ] Aplicar grade de color coherente (sombras frías + acentos rojo UR).  
- [ ] Verificar licencia de stock si se sustituyen las del PPT.  
- [ ] **No** depender de URLs `images.higgs.ai` del brief Lithos en producción.  
- [ ] Fallback local si falla la red.

Rutas previstas (cuando existan):

```text
02_recursos/hero/
  bg_base.webp          ← capa base
  bg_reveal_dna.webp    ← capa spotlight (ADN)
  README.md             ← notas de uso
```

Hasta entonces, el implementador usa `imagenes_referencia/slide*.jpg` con filtros CSS (`brightness`, `contrast`) si hace falta.

### 3.3 Logo

- Nav: logo **horizontal blanco** (`02_recursos/logos/LOGO HORIZONTAL UR BLANCO.png`) en fondos oscuros.  
- No usar el SVG geométrico de Lithos.  
- Wordmark de producto (propuesta): **DeepTech** o **Transferencia DeepTech** en Inter semibold; el nombre de la universidad va con el logo oficial.

---

## 4. Tipografía y color

### 4.1 Fuentes

**Propuesta A (cercana a Lithos, premium):**

```css
/* src/index.css — cuando se implemente */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@1,400;1,500;1,600&display=swap');
* { font-family: 'Inter', sans-serif; }
.font-display { font-family: 'Playfair Display', serif; }
```

- UI / body: **Inter**  
- Acentos de título del hero: **Playfair Display italic** (una línea)  

**Propuesta B (más institucional):** solo Inter / sistema + logo UR, sin serif de moda.  
→ **Decisión abierta** con contraparte (anotar en Fase 4). Default de este spec: **Propuesta A** para el hero; formularios 100% Inter.

### 4.2 Tokens de color (DeepTech UR)

| Token | Valor | Uso |
|-------|-------|-----|
| `--ur-red` | `#C8102E` | CTA principal, acentos (reemplaza naranja Lithos) |
| `--ur-red-hover` | `#9a0c24` | Hover CTA |
| `--ink` | `#0a0a0a` / `black` | Fondos hero |
| `--surface` | `#FFFFFF` | Formularios, cards claras |
| `--muted` | `white/80` | Texto secundario sobre foto |
| `--pill` | `white/20` + blur | Nav central |

CTA hero (equivalente a “Start Digging”):

```
bg-[#C8102E] hover:bg-[#9a0c24] text-white ... rounded-full
hover:shadow-[#C8102E]/30
```

**No usar** `#e8702a` de Lithos.

---

## 5. Hero — estructura (adaptada)

Root: `min-h-screen bg-white tracking-[-0.02em]`, `fontFamily: Inter`.

**Section** `relative w-full overflow-hidden h-screen bg-black` + `height: 100dvh`.

Capas z-index (igual mecánica Lithos):

| z | Capa | Contenido DeepTech |
|---|------|--------------------|
| 10 | Base image | `BG_IMAGE_1` + clase `hero-zoom` |
| 30 | `RevealLayer` | `BG_IMAGE_2` (ADN) + spotlight |
| 50 | Heading | Copy del programa |
| 50 | Bottom-left | Párrafo institucional (sm+) |
| 50 | Bottom-right | Párrafo + CTA |
| 100 | Nav fija | Logo UR + menú + Sign Up |

### 5.1 Copy del hero (propuesta — editable)

**H1 línea 1** (Playfair italic):  
`La ciencia`  

**H1 línea 2** (Inter):  
`se convierte en empresa`  

Alternativa más literal al brief:  
`DeepTech` / `con sello Rosario`

**Bottom-left (sm+):**  
> Cada postulación es un resultado de investigación con potencial de transferencia. Evaluamos equipo, modelo de negocio y madurez tecnológica con rigor y trazabilidad.

**Bottom-right:**  
> Inscríbete, completa tu postulación y obtén un diagnóstico de madurez (KTH IRL) y un score DeepTech ponderado.

**CTA:** `Postular` o `Comenzar postulación`  
(no “Start Digging”)

### 5.2 Spotlight (misma spec técnica que Lithos)

- `SPOTLIGHT_R = 260`  
- `mouse` / `smooth` / RAF lerp `* 0.1`  
- `RevealLayer` con canvas oculto + radial gradient mask  
- Stops idénticos al brief Lithos  
- `prefers-reduced-motion`: sin animaciones de entrada; spotlight puede desactivarse o fijarse al centro  

### 5.3 Navegación (labels DeepTech)

| Zona | Lithos | DeepTech UR |
|------|--------|-------------|
| Logo | SVG + “Lithos” | Logo UR blanco + “DeepTech” (opcional) |
| Pill central | Course, Field Guides… | **Convocatoria · Criterios · Metodología · FAQ · Contacto** (ajustar a páginas reales) |
| Activo | Course | Convocatoria (o Inicio) |
| Derecha | Sign Up | **Ingresar** / **Inscribirse** |
| Mobile | hamburger `md:hidden` | igual |

Enlaces ancla o rutas:

| Item | Ruta sugerida |
|------|----------------|
| Convocatoria | `/#convocatoria` o `/convocatoria` |
| Criterios | `/#criterios` |
| Metodología | `/metodologia` (IRL + score explicados) |
| FAQ | `/faq` |
| Contacto | `/contacto` |
| Inscribirse | `/auth/registro` |
| Ingresar | `/auth/login` |

---

## 6. Animaciones

Reutilizar las keyframes del brief Lithos en `index.css`:

- `heroReveal`, `heroFadeUp`, `heroZoom`  
- Clases `.hero-anim`, `.hero-reveal`, `.hero-fade`, `.hero-zoom`  
- Reduced motion: opacity 1, sin animation  

Aplicación igual: zoom en base, stagger en títulos, fade en bloques inferiores.

---

## 7. Mapa de pantallas (app completa)

```text
/                     Landing + hero spotlight
/auth/login           Login
/auth/registro        Alta postulante + consentimiento datos
/app                  Dashboard postulante (mis postulaciones)
/app/nueva            Wizard postulación
/app/:id              Continuar borrador
/app/:id/resultado    Score + IRL + descarte (si submitted)
/admin                Panel evaluadores (protegido)
/admin/postulaciones  Lista + filtros
/admin/postulaciones/:id  Detalle + override
```

### 7.1 Wizard de postulación (UX)

Pasos alineados a `postulacion.json`:

1. **Equipo y vínculo** (datos contacto + flags de descarte temprano).  
2. **Modelo de negocio**.  
3. **Innovación / tecnología**.  
4. **Tipo de postulación + sector** (dispara set IRL).  
5. **Autoevaluación IRL** (solo dims aplicables).  
6. **Revisión y envío**.

Comportamiento:

- Autosave a API cada N segundos o al cambiar de paso.  
- Obligatorios bloquean avance/submit.  
- Opcionales marcados visualmente.  
- Upload de archivo en prototipos.  
- Indicador de progreso.  
- Mobile-first en el form (el hero es desktop-impact; el form debe ser impecable en móvil).

### 7.2 Pantalla de resultado

- Banner estado: `Descartada` | `En evaluación` | `Diagnosticada`.  
- Si descarte: motivo(s) claros (trazabilidad).  
- Si apta:  
  - Score total + **3 bloques** con barras.  
  - Tabla variable → puntos → contribución.  
  - Radar/spider IRL (dims condicionales).  
  - Cards de insights IA (cuando existan).  
- CTA: descargar PDF resumen (fase posterior).

### 7.3 Tema claro vs oscuro

| Superficie | Tema |
|------------|------|
| Landing hero | Oscuro (foto full-bleed) |
| Auth + formularios + admin | Claro (`bg-white` / `zinc-50`), texto `zinc-900`, acento rojo UR |
| Resultado | Claro con cards; acentos rojo/teal para OK/warn |

---

## 8. Componentes UI (inventario mínimo)

| Componente | Notas |
|------------|-------|
| `HeroSpotlight` | Port de mecánica Lithos + assets ADN |
| `RevealLayer` | Canvas mask |
| `SiteNav` | Logo UR, pill, auth buttons |
| `Button` | primary (rojo UR), secondary, ghost |
| `Input`, `Textarea`, `Select`, `RadioLevel` | Niveles de score como radios con etiqueta |
| `FileUpload` | Prototipo |
| `StepWizard` | Multi-paso |
| `ScoreBreakdown` | Bloques + líneas |
| `IrlRadar` | chart (recharts o similar) |
| `DiscardBanner` | Motivos |
| `AiInsightCard` | Resumen contraste |
| `ProtectedRoute` | Por rol |

---

## 9. Stack frontend (detalle)

| Pieza | Elección |
|-------|----------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Estilos | Tailwind CSS 3 |
| Iconos | lucide-react |
| Routing | react-router-dom |
| Data fetching | fetch/tanstack-query |
| Forms | react-hook-form + zod (schemas desde catálogo) |
| Charts | recharts (radar IRL) |
| Deploy | Vercel (MVP) → Azure Static Web Apps (prod UR) |

Generación de tipos/schemas desde `01_datos_limpios` (script futuro) para no hardcodear las 30 variables a mano.

---

## 10. Accesibilidad y performance

- Contraste AA en textos sobre imagen (shadow/scrim si hace falta).  
- Spotlight: no es la única forma de “ver” contenido; el copy y CTAs no dependen del mouse (móvil: reveal suave fijo o desactivado).  
- En touch devices: desactivar seguimiento de cursor; mostrar `BG_IMAGE_2` con opacidad baja global o spotlight centrado.  
- Lazy load de imágenes hero.  
- `prefers-reduced-motion`.  
- Alt text desde `imagenes_descripciones.json`.

---

## 11. Qué NO hacer en el front

- No calcular score “oficial” solo en cliente (puede haber preview, pero el submit revalida en API).  
- No mezclar marca HUB iEX / benorth / Lithos naranja.  
- No usar copy de geología ni assets Higgs del prompt de referencia.  
- No exponer keys de IA en el bundle.  
- No empezar implementación hasta orden de Fase 5 + spec motor (Fase 2).

---

## 12. Checklist Fase 4 (visual) antes de código

- [ ] Aprobar copy del hero con contraparte  
- [ ] Aprobar Propuesta A vs B de tipografía  
- [ ] Preparar `02_recursos/hero/bg_*.webp`  
- [ ] Confirmar CTA label (“Postular” / “Inscribirse”)  
- [ ] Moodboard 1 página (logo + rojo + 2 fotos + botones)  
- [ ] Wireframe simple wizard (Figma o markdown)  

---

## 13. Resumen

| Aspecto | Decisión de este spec |
|---------|----------------------|
| Mecánica hero | Spotlight Lithos **tal cual** (canvas mask) |
| Imágenes | ADN reveal + base lab/robótica **locales UR** |
| Color CTA | Rojo institucional `#C8102E` |
| Marca | Logo UR + DeepTech |
| App | SPA React con wizard + resultados + admin |
| Backend | Consume API descrita en `ARQUITECTURA_BACKEND_Y_HOSTING.md` |
