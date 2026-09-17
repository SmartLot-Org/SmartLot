# SmartLot — Sistema de Diseño

## Dirección Estética: Azul Señal

Una estética industrial-precisa construida sobre el azul que ya domina el producto. No se inventa una paleta nueva — se sistematiza y refina lo que existe.

El azul señalético (#156fe5 / #2563eb) evoca paneles de control marítimos, señalética de hospitales e infraestructura urbana. Es un azul funcional, de alta visibilidad, que comunica confianza y precisión operativa.

Inspiración: paneles de instrumentación técnica, señalética de transporte, dashboards de control industrial, la claridad de un plano de ingeniería bien ejecutado.

El sistema es **preciso, funcional y consistente** — prioriza la legibilidad operativa sobre la decoración.

---

## Tipografía

| Uso | Fuente | Peso |
|-----|--------|------|
| Títulos de landing (display) | **Archivo** | 600–900 |
| Títulos de producto | **DM Sans** | 500–700 |
| Subtítulos | **DM Sans** | 500 |
| Cuerpo | **DM Sans** | 400 |
| Datos/monospace | **JetBrains Mono** | 400–600 |
| UI (botones, labels) | **DM Sans** | 500 |

DM Sans ya se usa en el códigobase y sigue siendo la voz de producto (app, dashboards, formularios). **Archivo** es la voz display de las superficies de landing (H1/H2 de marketing). JetBrains Mono se usa para datos. La solidez tipográfica viene de la jerarquía, no de la variedad.

---

## Paleta de Color (extraída del código existente)

### Base

| Variable | Color actual | Uso |
|----------|-------------|-----|
| `--bg` | `#F5F7FB` | Fondo de página |
| `--bg-surface` | `#FFFFFF` | Tarjetas, paneles |
| `--bg-elevated` | `#F1F5F9` | Hover, secciones secundarias |
| `--bg-dark` | `#191C1E` | Header, footer, nav |
| `--bg-dark-alt` | `#1A1C1E` | Superficie oscura alternativa |

### Tokens Tailwind v4 (`@theme` en `src/index.css`)

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-brand-deep` / `--color-brand-navy` | `#0C1E3F` | Superficies oscuras, texto sobre claro |
| `--color-brand-blue` | `#2563EB` | Acento, CTAs, enlaces |
| `--color-brand-sky` | `#93C5FD` | Bordes y hovers secundarios, avatares |
| `--color-brand-bg` / `--color-brand-cream` | `#F5F7FB` | Fondo de página |
| `--color-brand-surface` | `#FFFFFF` | Tarjetas, paneles |
| `--color-brand-warm` | `#1E293B` | Texto principal |
| `--color-brand-muted` | `#475569` | Texto secundario (AA: 7.07:1 sobre `#F5F7FB`) |

Familia del azul señal para canvas y partículas: `#2563EB` · `#1D4ED8` · `#3B82F6` · `#60A5FA` · `#93C5FD`.

### Texto

| Variable | Color actual | Uso |
|----------|-------------|-----|
| `--text-primary` | `#1E293B` | Cuerpo principal |
| `--text-secondary` | `#475569` | Metadatos, descripciones (AA: 7.07:1 sobre `#F5F7FB`) |
| `--text-muted` | `#94A3B8` | Placeholder, texto secundario |
| `--text-inverse` | `#E2E8F0` | Sobre fondos oscuros |

### Acento primario

| Variable | Color actual | Uso |
|----------|-------------|-----|
| `--accent` | `#2563EB` | Botones, enlaces, elementos activos |
| `--accent-hover` | `#156FE5` | Hover de acento |
| `--accent-active` | `#1A73E8` | Active/pressed |
| `--accent-bg` | `#DBEAFE` | Fondos de badge/etiqueta azul |
| `--accent-border` | `#BFDBFE` | Bordes de estado azul |

### Semántica

| Variable | Color actual | Uso |
|----------|-------------|-----|
| `--success` | `#22C55E` | Disponible, activo |
| `--success-bg` | `#F0FDF4` | Fondo de badge success |
| `--warning` | `#EAB308` | Alerta media |
| `--warning-bg` | `#FEFCE8` | Fondo de badge warning |
| `--error` | `#EF4444` | Lleno, error, bloqueado |
| `--error-bg` | `#FEF2F2` | Fondo de badge error |
| `--error-strong` | `#B91C1C` | Error en hover/active |

### Bordes

| Variable | Color actual | Uso |
|----------|-------------|-----|
| `--border` | `#E2E8F0` | Bordes de tarjetas, inputs, tablas |
| `--border-strong` | `#CBD5E1` | Bordes en foco |
| `--border-accent` | `#2563EB` | Borde de estado activo |

---

## Radios y Sombras

| Variable | Valor | Uso |
|----------|-------|-----|
| `--radius-sm` | `6px` | Badges, inputs |
| `--radius-md` | `10px` | Tarjetas, botones |
| `--radius-lg` | `14px` | Paneles grandes |
| `--radius-full` | `9999px` | Pills, avatares |

| Variable | Valor |
|----------|-------|
| `--shadow-sm` | `0 1px 3px rgba(15, 23, 42, 0.06)` |
| `--shadow-md` | `0 4px 12px rgba(15, 23, 42, 0.08)` |
| `--shadow-lg` | `0 8px 30px rgba(15, 23, 42, 0.1)` |
| `--shadow-accent` | `0 4px 14px rgba(37, 99, 235, 0.25)` |

---

## Componentes

### Botones

| Variante | Fondo | Texto |
|----------|-------|-------|
| Primary | `--accent` | `#FFFFFF` |
| Primary hover | `--accent-hover` | `#FFFFFF` |
| Secondary | Transparente | `--text-primary` / borde `--border` |
| Ghost | Transparente | `--text-secondary` |
| Danger | `--error` | `#FFFFFF` |

Altura unificada: `40px` (md), `48px` (lg). Radio `--radius-md`.

### Inputs

Floating labels (patrón existente). Caja de `48px`. Borde `--border`. Focus: borde `--accent` + ring `rgba(37, 99, 235, 0.15)`. Error: borde `--error`.

### Badges

| Tipo | Fondo | Texto |
|------|-------|-------|
| neutral | `--bg-elevated` | `--text-secondary` |
| success | `--success-bg` | `--success` |
| warning | `--warning-bg` | `--warning` |
| error | `--error-bg` | `--error` |
| info | `--accent-bg` | `--accent` |

Radio `--radius-sm`, padding `2px 8px`, DM Sans 500 12px.

