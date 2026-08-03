# Listas desplegables — Facultades y sectores

Resueltas en el brief de planeación (Parte A.5). Listas para insertar en el formulario sin investigación adicional.

También disponibles como JSON en `listas_desplegables.json` (misma carpeta).

---

## 1. Facultades y escuelas — Universidad del Rosario

Verificado contra el sitio oficial de la universidad (referencia del brief: agosto 2026 / urosario.edu.co).

| # | Facultad / Escuela |
|---|--------------------|
| 1 | Escuela de Administración |
| 2 | Escuela de Ciencias Humanas |
| 3 | Escuela de Ciencias e Ingeniería |
| 4 | Escuela de Medicina y Ciencias de la Salud |
| 5 | Facultad de Creación |
| 6 | Facultad de Economía |
| 7 | Facultad de Estudios Internacionales, Políticos y Urbanos |
| 8 | Facultad de Jurisprudencia |
| 9 | Otra / Interdisciplinar (especificar) |

**Nota:** la Graduate School of Business (GSB) opera como oferta de posgrado dentro de la Escuela de Administración; no se incluye como línea aparte salvo que se quiera distinguir explícitamente posgrado de pregrado.

**Campo de formulario:** `FACULTAD / UNIDAD ACADEMICA` (obligatorio en postulación).

---

## 2. Sectores económicos / industria (Deeptech)

Lista curada de 17 opciones (16 sectores + otro), con trazabilidad a CIIU Rev. 4 A.C. (DANE/DIAN).

| # | Sector | Sección CIIU de referencia |
|---|--------|----------------------------|
| 1 | Salud y ciencias de la vida (biotecnología, medtech, farma) | Q, C21 |
| 2 | Agroindustria y agrotecnología | A |
| 3 | Energía y sostenibilidad | D |
| 4 | Medio ambiente y economía circular | E |
| 5 | Nuevos materiales y manufactura avanzada | C |
| 6 | Industria 4.0, robótica y automatización | C, M |
| 7 | Tecnologías de la información, software e IA | J |
| 8 | Electrónica, hardware y dispositivos | C26–C27 |
| 9 | Aeroespacial, defensa y nuevas movilidades | C30 |
| 10 | Fintech y servicios financieros | K |
| 11 | Edtech y capital humano | P |
| 12 | Industrias creativas y culturales (economía naranja) | R |
| 13 | Construcción, infraestructura y proptech | F, L |
| 14 | Minería y recursos naturales | B |
| 15 | Comercio, logística y cadena de suministro | G, H |
| 16 | Turismo y servicios de experiencia | I |
| 17 | Otro sector (especificar) | — |

**Campo de formulario:** `Mercado o industria al que pertenece el emprendimiento` (obligatorio; casilla con listado de industrias/sectores).

**Regla de enrutamiento sugerida:** si el sector es **Salud y ciencias de la vida**, el tipo IRL por defecto puede ser “sector salud” (+ RRL), sujeto a la clasificación de tipo de postulación del proceso (desarrollo vs. adaptación).

---

## Fuentes

- Facultades: urosario.edu.co (escuelas y facultades) — según brief de planeación.  
- Sectores: DANE, CIIU Rev. 4 A.C. — curación del brief para Deeptech.
