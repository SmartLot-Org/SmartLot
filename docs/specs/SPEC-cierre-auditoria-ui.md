# Spec: Cierre de la auditoría UI (verificación runtime y revisión visual)

> Estado: En revisión (espera aprobación del dueño antes de planificar)
> Módulo: `cierre-auditoria-ui`
> Última actualización: 2026-10-22

## Objetivo

Cerrar la auditoría UI de SmartLot: todos los fixes de código (P1–P3, P5 parte de código y métricas P6) ya
están aplicados, pero **la verificación en navegador/dispositivo/API está incompleta**. Esta spec define qué
falta, cómo se verifica y qué significa «terminado», para que cualquier sesión (humana o de agente) pueda
retomar sin reabrir lo ya hecho. Destinatario: el dueño del producto y quien continúe la auditoría.

Éxito en una frase: cada check abierto tiene evidencia registrada (o una decisión explícita de diferirlo) y
`docs/audit-ui/` queda marcado como cerrado.

**Criterios de aceptación:**

- [ ] Revisión visual P6, **ronda 2 de máx. 2** (desktop 1440 + móvil 360 px) de rutas protegidas por rol:
      empleado, garagista, dueño de garage y los paneles ya vistos con datos reales. Defectos corregidos en
      un solo batch y confirmados.
- [ ] P5 #1: `/nueva_reserva` a 360, 375 y 390 px sin recorte ni desborde (rol empleado).
- [ ] P5 #3: `/superadmin/conflictos` con **al menos una fila** a 769, 860 y 956 px: el desplazamiento queda
      dentro de `.conflicts-table-shell` y la página no se ensancha.
- [ ] Las 3 barras de progreso (`panel-stats__progress-bar`, `dops-track-fill`, `trend-tooltip__fill`) vistas con
      0 %, valor intermedio y 100 %: extremo redondeado correcto, sin saltos.
- [ ] Focus trap de `ModalPortal` verificado con teclado real (Tab/Shift+Tab ciclan, Escape cierra y devuelve
      el foco al disparador) en al menos 3 modales.
- [ ] Combobox de sede verificado con teclado en `formulario_infoPersonal`/`formulario_zona`.
- [ ] P5 #2: contraste compuesto ≥ 4.5:1 sobre vidrio (landing/auth) y `.panel-stats-card`, medido con muestras
      de píxel.
- [ ] P5 #4, #5, #6, #7, #8 ejecutados o diferidos con motivo (ver «Preguntas abiertas»).
- [ ] ADR-009 decidido (aceptado/rechazado) y, si procede, aplicado.
- [ ] `impeccable detect --json` corrido una vez, o su imposibilidad documentada y aceptada.
- [ ] `docs/audit-ui/README.md`, `pendientes.md`, `cambios-realizados.md` e `docs/index.md` actualizados al cierre.

## Supuestos

1. El frontend se verifica contra el backend local (`SmartLot_API`, `node src/app.js`, puerto 3000) conectado
   a la base Supabase **real**; por eso las rondas son de solo lectura (ADR-010).
2. La sesión se obtiene iniciando sesión con Google en una ventana de Edge con perfil aislado; la suplantación
   («Ingresar como») es la vía para ver otros roles. La sesión suplantada vence.
3. Los checks que exigen **escribir** (cámara QR con ingreso/egreso, checkout de Mercado Pago) necesitan
   usuarios de prueba o un entorno de desarrollo; no se harán contra datos reales.
4. La base actual tiene 0 conflictos y 0 % de ocupación: algunos checks necesitan datos de prueba.
5. P4 (contrastes del superadmin) sigue **diferido por ADR-007**; no entra aquí salvo decisión del dueño.
6. No se agregan dependencias ni se toca `src/api/client.js`/`src/cache/*`.

## Comandos

```bash
# Dependencias (el checkout puede venir sin node_modules)
npm ci
# Frontend (proxy /api -> http://localhost:3000)
npm run dev
# Backend (repo hermano SmartLot_API)
cd ../SmartLot_API/SmartLot_API && node ./src/app.js
# Cierre de cada tanda
npm test
npx eslint <archivos tocados>
npm run build
```

## Estructura del proyecto

- `docs/audit-ui/` → estado, hallazgos, plan, cambios (§1–§13) y pendientes; `README.md` es el índice.
- `docs/decisions/` → ADR-007 (paleta superadmin), ADR-008 (plazas), ADR-009 (overlay sin blur, propuesto),
  ADR-010 (método de verificación runtime).
- `docs/specs/` → esta spec.
- `src/` → solo si una verificación revela un defecto (se corrige y se registra en `cambios-realizados.md`).

## Estilo de código

Sin código nuevo previsto salvo correcciones. Patrón de las correcciones de esta auditoría (CSS con tokens,
sin animar layout, foco visible, comentario en español solo para el porqué):

```css
.panel-stats__progress-bar {
  width: 100%;
  /* El avance se anima con translateX (no con width) para no recalcular layout. */
  transition: transform 1.2s ease-out;
}
```

## Estrategia de pruebas

- Automática: `npm test` (130/130 al 2026-10-22), `npx eslint` dirigido, `npm run build`.
- Runtime: Edge con perfil aislado + CDP (ADR-010); esperas reales y pestaña en primer plano; capturas a 1440 y
  360 px; sondas de `scrollWidth`/`innerWidth` y de `document.activeElement` con teclas reales.
- Tests nuevos solo si un fix lo amerita (`*.source.test.js` para contratos de fuente).

## Límites

- **Siempre:** respetar `DESIGN.md` y ADR-007; cerrar cada tanda con test + lint dirigido + build y actualizar
  los tres documentos de `audit-ui/`; solo lectura sobre datos reales; apagar los servidores al terminar.
- **Preguntar antes de:** cambiar el overlay de `ModalPortal` (ADR-009), crear usuarios de prueba en la base,
  tocar el cliente HTTP o la caché, cambiar roles/rutas protegidas, reescribir `docs/reservation-limit.md` o
  `docs/estados-vacios.md`.
- **Nunca:** usar contraseñas/cookies del navegador personal, mutar datos reales, commitear `.env` o secretos,
  borrar ADRs, commitear sin pedido explícito.

## Fuera de alcance

- Cambios de color/contraste dentro del panel superadmin (ADR-007).
- Corregir los 99 errores de lint global preexistentes (se valida solo lo tocado).
- Rediseños: la auditoría es refinamiento.
- Backend (`SmartLot_API`).

## Preguntas abiertas

- [ ] **ADR-009:** ¿se quita el blur del overlay de los modales (opción A), se declara excepción (B) o se
      reduce (C)?
- [ ] ¿Se autorizan **usuarios de prueba por rol** (empleado, garagista, dueño de garage, admin) en la base de
      desarrollo, o hay un entorno de desarrollo separado de la base real?
- [ ] Para P5 #5/#6/#7 (cámara real, sandbox de Mercado Pago, preferencia real de reduce-motion del SO), ¿quién
      los ejecuta y en qué dispositivo? Si no es viable, ¿se difieren con motivo y se cierra la auditoría sin ellos?
- [ ] ¿Se acepta cerrar sin `impeccable detect` si el launcher sigue bloqueado por directiva de grupo de
      Windows, o se gestiona una excepción con IT?
- [ ] ¿Se aprueba el commit/push de cada tanda al cierre (hoy solo a pedido explícito)?
