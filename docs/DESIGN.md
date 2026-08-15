---
version: "1.0"
name: santiago-ramon-design-system
description: |
  Sistema de diseño UI para la plataforma de Santiago Ramón — Personal Trainer. Base clara y densa (pensada para tablas y formularios del panel admin) con negro y rojo del logo como acento de marca fuerte: sidebar y header del portal en negro, rojo reservado para CTAs primarios, badges de estado y foco. Titulares y botones en Oswald (condensada, bold — hace eco a la tipografía del logo); cuerpo, tablas y formularios en Inter (legibilidad en listas largas de alumnos/ejercicios). No define objetivo de negocio ni copy — es únicamente vocabulario de UI: color, tipografía, espaciado, tamaños y componentes base.

colors:
  brand: "#F20F38"
  brand-pressed: "#BF0426"
  brand-deep: "#8C041D"
  on-brand: "#FFFFFF"
  ink: "#0D0D0D"
  ink-soft: "#404040"
  mute: "#6B6B6B"
  canvas: "#FFFFFF"
  surface-soft: "#F2F2F2"
  hairline: "#E5E5E5"
  success: "#16A34A"
  success-bg: "#DCFCE7"
  error: "#8C041D"
  error-bg: "#FBE7E9"

typography:
  display:
    fontFamily: Oswald
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.4px
  heading-lg:
    fontFamily: Oswald
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.2
  heading-md:
    fontFamily: Oswald
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.25
  heading-sm:
    fontFamily: Oswald
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0.4px
    textTransform: uppercase
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-strong:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
  button:
    fontFamily: Oswald
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.2px

rounded:
  none: 0px
  sm: 8px
  md: 16px
  lg: 24px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  section: 48px

components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 10px 20px
    height: 44px
  button-primary-pressed:
    backgroundColor: "{colors.brand-pressed}"
    textColor: "{colors.on-brand}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 10px 20px
    height: 44px
    border: 1px solid {colors.hairline}
  button-destructive:
    backgroundColor: "{colors.brand-deep}"
    textColor: "{colors.on-brand}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 10px 20px
    height: 44px
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.ink-soft}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 8px 12px
  sidebar-nav:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-brand}"
    typography: "{typography.body-strong}"
    width: 240px
  sidebar-nav-link-active:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    rounded: "{rounded.sm}"
  portal-header:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-brand}"
    typography: "{typography.heading-md}"
    padding: 16px 20px
  card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 24px
    border: 1px solid {colors.hairline}
  card-soft:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 24px
  data-table-row:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    padding: 12px 16px
    border-bottom: 1px solid {colors.hairline}
  data-table-row-alt:
    backgroundColor: "{colors.surface-soft}"
  badge-neutral:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  badge-success:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  badge-overdue:
    backgroundColor: "{colors.error-bg}"
    textColor: "{colors.brand-deep}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: 10px 12px
    height: 40px
    border: 1px solid {colors.hairline}
  text-input-focused:
    border: 2px solid {colors.brand}
  accordion-item:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    border: 1px solid {colors.hairline}
  modal-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 32px
---

## Overview

Sistema de UI anclado al logo de Santiago Ramón (mascota toro, negro/rojo, tipografía condensada tipo "team jersey"). Base clara — fondo blanco/gris muy suave — porque el panel admin es una herramienta de trabajo densa en tablas y formularios (listados de alumnos, ejercicios, plantillas), donde un fondo oscuro generalizado dificulta el escaneo de filas largas. El negro y el rojo del logo se reservan como **acento de marca**, no como superficie de fondo: negro en la sidebar admin y en el header del portal del alumno, rojo en CTAs primarios, badges de estado y anillo de foco.

Dos familias tipográficas: **Oswald** (condensada, bold) para titulares y botones — es la que conecta visualmente con las letras del logo — e **Inter** para todo el texto de trabajo (tablas, formularios, cuerpo de rutina), porque a tamaños chicos una condensada pesada cansa la lectura.

**Key Characteristics:**
- Base clara (`{colors.canvas}` blanco, `{colors.surface-soft}` gris suave) para máxima legibilidad en tablas y formularios densos
- Negro (`{colors.ink}`) reservado para sidebar admin y header del portal — nunca como fondo general de contenido
- Rojo de marca (`{colors.brand}` `#F20F38`) escaso y predecible: un CTA primario por pantalla, badges de estado, anillo de foco
- Oswald condensada en titulares/botones + Inter en cuerpo — dos voces, una atlética y una utilitaria
- Radio único de 16px (`{rounded.md}`) en casi todo — igual al ya implementado en el proyecto, no se reinicia visualmente lo que ya está construido
- Componentes acotados a lo que la app realmente usa: sin pricing cards, sin masonry, sin nav de marketing

## Colors

### Brand & Accent
- **Rojo** (`{colors.brand}` — `#F20F38`): extraído directo del logo. CTA primario, badge de cuota vencida, anillo de foco. Uno por viewport — su fuerza viene de la escasez.
- **Rojo Pressed** (`{colors.brand-pressed}` — `#BF0426`): estado presionado/hover del botón primario.
- **Rojo Granate** (`{colors.brand-deep}` — `#8C041D`): variante destructiva (desactivar alumno, eliminar ejercicio) y color de error — reutiliza el granate más oscuro del logo en vez de inventar un rojo nuevo.

### Surface
- **Canvas** (`{colors.canvas}` — `#FFFFFF`): fondo base del panel y del portal.
- **Surface Soft** (`{colors.surface-soft}` — `#F2F2F2`): cards, filas alternadas de tabla, fondos de card secundaria.
- **Hairline** (`{colors.hairline}` — `#E5E5E5`): bordes de card, inputs, divisores de tabla.
- **Ink** (`{colors.ink}` — `#0D0D0D`): negro del logo. Fondo de sidebar admin y header del portal — la única superficie oscura del sistema.

### Text
- **Ink** (`{colors.ink}` — `#0D0D0D`): texto principal sobre superficies claras.
- **Ink Soft** (`{colors.ink-soft}` — `#404040`): texto secundario, labels de formulario.
- **Mute** (`{colors.mute}` — `#6B6B6B`): metadata, placeholders, texto deshabilitado.
- **On Brand** (`{colors.on-brand}` — `#FFFFFF`): texto sobre `{colors.brand}`, `{colors.brand-deep}` e `{colors.ink}`.

### Semantic
- **Success** (`{colors.success}` — `#16A34A`) / **Success Bg** (`{colors.success-bg}` — `#DCFCE7`): único color fuera de la paleta de marca — checks de progreso completado, cuota al día.
- **Error** (`{colors.error}` — `#8C041D`) / **Error Bg** (`{colors.error-bg}` — `#FBE7E9`): reutiliza `{colors.brand-deep}` — mensajes de error, cuota vencida.

> **Nota de contraste:** `{colors.brand}` es muy saturado. Verificar WCAG AA en texto blanco sobre badges chicos (12-14px) antes de darlo por definitivo — en botones grandes (44px, `{typography.button}`) no hay problema.

## Typography

### Familias
- **Oswald** (Google Fonts, pesos 500/600/700): titulares, botones, labels de sección en mayúscula. Condensada — hace eco directo a la tipografía del logo sin copiar una fuente propietaria.
- **Inter** (Google Fonts, pesos 400/500/600): cuerpo, tablas, formularios, texto de rutina en el portal. Ya está en uso en el proyecto — se mantiene.

### Jerarquía

| Token | Tamaño | Peso | Familia | Uso |
|---|---|---|---|---|
| `{typography.display}` | 40px | 700 | Oswald | Título de página (portal: nombre del alumno) |
| `{typography.heading-lg}` | 28px | 600 | Oswald | Título de sección admin |
| `{typography.heading-md}` | 20px | 600 | Oswald | Título de card, título de modal |
| `{typography.heading-sm}` | 14px | 600 | Oswald (mayúscula) | Label de sección, eyebrow ("DÍA 1 — TREN SUPERIOR") |
| `{typography.body}` | 16px | 400 | Inter | Cuerpo, texto de formulario |
| `{typography.body-strong}` | 16px | 600 | Inter | Énfasis inline, nombre de alumno en tabla |
| `{typography.body-sm}` | 14px | 400 | Inter | Celdas de tabla, texto secundario |
| `{typography.caption}` | 12px | 500 | Inter | Badges, metadata |
| `{typography.button}` | 14px | 600 | Oswald | Label de todos los botones |

### Principios
- Oswald nunca baja de 14px — a tamaños chicos pierde legibilidad por ser condensada. Todo lo que esté por debajo pasa a Inter.
- Jerarquía por tamaño y peso, no por color — el rojo no se usa para "destacar texto", solo para acciones y estados.

## Layout

### Espaciado
Base de 8px: `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.section}` 48px.

Padding interno de card: `{spacing.lg}` (24px). Gap entre cards en grillas: `{spacing.md}` (16px). Separación entre secciones de página: `{spacing.section}` (48px) — deliberadamente menor a los 96px de un sistema editorial de marketing, porque acá el contenido es denso (tablas, formularios), no una landing.

## Shapes

| Token | Valor | Uso |
|---|---|---|
| `{rounded.none}` | 0px | Header/sidebar (superficies estructurales) |
| `{rounded.sm}` | 8px | Inputs, badges chicos, filas de acordeón |
| `{rounded.md}` | 16px | Botones, cards — el radio dominante, ya implementado en el proyecto |
| `{rounded.lg}` | 24px | Modales |
| `{rounded.full}` | 9999px | Badges de estado, avatar |

## Components

### Buttons
- **`button-primary`**: fondo `{colors.brand}`, texto blanco, `{typography.button}`, radio `{rounded.md}`, alto 44px. Acción principal de cada pantalla.
- **`button-secondary`**: fondo `{colors.canvas}`, borde `{colors.hairline}`, texto `{colors.ink}`. Acciones secundarias ("Cancelar").
- **`button-destructive`**: fondo `{colors.brand-deep}`. "Desactivar alumno", "Eliminar ejercicio".
- **`button-ghost`**: sin fondo, texto `{colors.ink-soft}`. Enlaces de acción de baja jerarquía.

### Navigation
- **`sidebar-nav`**: fondo `{colors.ink}`, ancho fijo 240px, texto blanco. Item activo con fondo `{colors.brand}` y radio `{rounded.sm}`.
- **`portal-header`**: barra negra fija arriba del portal del alumno con nombre en `{typography.heading-md}` — confirma identidad (HU-16).

### Cards & Data
- **`card`**: fondo blanco, borde `{colors.hairline}`, radio `{rounded.md}`. Base de card de alumno, ejercicio, día de rutina.
- **`card-soft`**: variante con fondo `{colors.surface-soft}`, sin borde — para agrupar contenido secundario dentro de una card.
- **`data-table-row`** / **`data-table-row-alt`**: filas de tabla con divisor `{colors.hairline}`, alternancia opcional con `{colors.surface-soft}` en listados largos.
- **`badge-neutral`** / **`badge-success`** / **`badge-overdue`**: estado de cuota y progreso — reemplaza directamente el uso actual en el listado de alumnos (HU-04).
- **`accordion-item`**: días de rutina en el portal (HU-16) — borde `{colors.hairline}`, radio `{rounded.sm}`.

### Inputs & Forms
- **`text-input`**: borde `{colors.hairline}`, radio `{rounded.sm}`, alto 40px. Foco: borde `{colors.brand}` de 2px.
- **`modal-card`**: fondo blanco, radio `{rounded.lg}`, padding 32px.

## Do's and Don'ts

### Do
- Reservar `{colors.brand}` para una sola acción/estado prioritario por pantalla.
- Usar `{colors.ink}` solo en sidebar admin y header del portal — nunca como fondo de contenido general.
- Mantener Oswald por encima de 14px; todo lo demás en Inter.
- Reusar `{colors.brand-deep}` tanto para "destructivo" como para "error" — no sumar un tercer rojo.

### Don't
- No introducir colores de acento adicionales (azul, verde de marca, morado). El sistema es negro + rojo + neutros, con verde reservado estrictamente a estados de éxito funcionales.
- No usar Oswald en cuerpo de texto ni en tablas — pierde legibilidad bajo 14px.
- No oscurecer el fondo general del panel admin — la densidad de datos (tablas de alumnos/ejercicios) necesita máximo contraste con fondo claro.

## Notas de implementación

- El `--radius: 1rem` ya definido en `app/globals.css` coincide con `{rounded.md}` — no requiere cambios.
- Aplicar `{colors.brand}` y familias tipográficas a `app/globals.css` y a los componentes shadcn/ui ya construidos es un trabajo de implementación aparte (no cubierto por este documento) — ver mapeo actualizado en `arquitectura.md` sección 9.
