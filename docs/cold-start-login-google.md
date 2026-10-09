# Cold start del backend — primer login con Google falla

Documento de trabajo (handoff). Última actualización: 2026-10-09.

## Problema

En producción (`https://www.smartlot.ar`), el primer clic en "Continuar con Google" después de un rato sin uso falla ("Hubo un error al conectar con Google.") y el segundo clic funciona perfecto. Ocurre siempre que pasan ~15 min sin tráfico.

## Causa raíz (confirmada con evidencia)

El backend `SmartLot_API` corre en **Render plan free**, que **se apaga tras ~15 min sin tráfico**. El primer request dispara el provisionamiento del contenedor y queda esperando; como el cliente axios corta a los **15 s** (`src/api/client.js:42`) y el bootstrap de sesión abortaba a los **10 s** (`AuthProvider.jsx`, código anterior), el primer pedido muere por timeout. Para el segundo intento el servidor ya está despierto.

Evidencia recolectada vía API REST de Render y MCP de Vercel:

| Evidencia | Dato |
|---|---|
| Servicio Render | `srv-d9tiet740ujc73eds6fg` (`SmartLot_API`), owner `tea-d9tibv942hec738a4ao0`, plan **free**, región oregon, 1 instancia, `healthCheckPath` vacío |
| Recicles de instancia (métricas `cpu`/`memory`) | `jwvfz` hasta ~09:40Z, `gn458` 10:15–10:25Z, `bm4j8` desde ~11:20Z → huecos = spin-down |
| Log de arranque en vivo | 2026-10-09 11:20:27–11:20:28Z: constructores, `server.js`, `Listening on http://localhost:3000`, `Conexión exitosa a Supabase` |
| Request caliente | `GET https://api.smartlot.ar/api/auth/google` → 200 en ~303 ms |
| Preflight CORS | `OPTIONS` → 204 en ~293 ms con `access-control-allow-origin: https://www.smartlot.ar` y `allow-credentials: true` |
| Bundle de producción | contiene `https://api.smartlot.ar` (env `VITE_API_URL` de Vercel) |

**Descartado**: CORS, TLS/certificados, `redirect_uri` de Google, bug del endpoint OAuth. Todo responde bien en caliente.

## Cambios realizados (sin commitear)

| Archivo | Cambio |
|---|---|
| `src/helpers/arranqueApi.js` **(nuevo)** | `esErrorDeArranque(error)` clasifica fallos sin respuesta o 502/503/504 (excluye cancelaciones); `conReintentoDeArranque(pedido, { intentos=2, esperaMs=3000 })` reintenta una vez; exporta `TIMEOUT_ARRANQUE_MS = 45000` |
| `src/contexts/AuthProvider.jsx` | El bootstrap `/api/usuario/me` usa `conReintentoDeArranque` + `timeout: TIMEOUT_ARRANQUE_MS`; ya no aborta a los 10 s; el `AbortController` queda solo para desmontaje |
| `src/componentesLanding/auth/LoginForm.jsx` | `handleGoogleLogin` reintenta; si el fallo es de arranque muestra "El servidor está iniciando. Esperá unos segundos y volvé a intentar." |
| `src/helpers/arranqueApi.test.js` **(nuevo)** | 4 tests: clasificación, reintento exitoso, no-reintento de errores de API, límite de intentos |
| `docs/architecture.md` | Bootstrap actualizado (45 s + reintento) y gotcha del cold start en Render free |

**No incluido a propósito**: mismo reintento en el login por contraseña (`handleSubmit`); el usuario acotó el fix a Google + bootstrap de sesión. Evaluar como seguimiento.

## Verificación hecha

- `npm test` → **117 tests pasan** (incluye los 4 nuevos).
- `npx eslint` sobre los 4 archivos tocados → sin errores.
- `npm run build` → OK (warning de chunks >500 kB es deuda preexistente).

## Pendiente

1. **Leer la medición de cold start** y ajustar la constante si hace falta.
   - Script: `C:\Users\DEVAND~1\AppData\Local\Temp\opencode\coldtest.ps1` (proceso `powershell` PID 14188, lanzado 11:47:29Z; dispara a las ~12:04:29Z tras 17 min idle y escribe `coldtest.json` en la misma carpeta; el proceso puede seguir vivo aunque el shell que lo lanzó se haya cerrado).
   - Interpretación: si `ms` ronda o supera 15000, confirma que el arranque excede el timeout viejo. Si el arranque real supera 45 s, subir `TIMEOUT_ARRANQUE_MS` en `src/helpers/arranqueApi.js`. Si da <5 s, la instancia estaba caliente (inconcluso): repetir tras ≥20 min sin tráfico.
2. **Deploy** del frontend (push a la rama de producción; Vercel auto-deploya) y prueba real: esperar >15 min sin tráfico, abrir `www.smartlot.ar/login` y hacer un único clic en Google. Criterio de éxito: funciona en el primer clic o, como máximo, muestra el aviso "El servidor está iniciando…" sin romper.
3. **Opcional**: aplicar el reintento al login por contraseña y a otros GET críticos del primer render.
4. **Producto**: evaluar Render **Starter (~US$7/mes)** para eliminar la causa raíz; no requiere código.
5. **Seguridad**: la API key de Render se compartió por chat y quedó en `C:\Users\DEVAND~1\AppData\Local\Temp\opencode\render_key.txt`; **rotarla** y borrar el archivo cuando ya no se use.
6. **Commit**: no se commiteó nada (regla del repo). Al commitear, incluir solo los 5 archivos de la tabla; `opencode.json` aparece modificado en `git status` pero **no es parte de este cambio**.

## Anexo: accesos y comandos útiles

- **Vercel**: team `team_f5SZxFy8QWopmtcHYBsYdo4J` (SmartLot), proyecto `smart-lot` = `prj_YDU4fj6mf2i0MEO04UXqNsxTjnhu`. Dominios: `smartlot.ar` (308 → `www`), `www.smartlot.ar`, `smart-lot-six.vercel.app`. Nota del MCP en esta sesión: `get_project` con `teamId` devolvía 404; `list_project_domains` y `filter_project_envs` funcionaron sin `teamId`. Las envs están encriptadas: **no desencriptar**.
- **Render REST** (el MCP daba `unauthorized`; se usó la key por Bearer):
  - Servicios: `GET /v1/services`
  - Eventos: `GET /v1/services/{id}/events`
  - Deploys: `GET /v1/services/{id}/deploys`
  - Logs: `GET /v1/logs?ownerId=...&resource=...&startTime=...&endTime=...&limit=...&direction=backward` (la app no loguea requests; el filtro `text=` no devolvió resultados en las pruebas)
  - Métricas: `GET /v1/metrics/{cpu|memory|instance-count}?resource=...&startTime=...&endTime=...&resolutionSeconds=300` (usar `/metrics/...`; `/v1/metrics?metric=...` da 404)
- **Subdominio Render**: `smartlot-api.onrender.com` responde 404 (política de subdominio deshabilitada); el tráfico real va por `api.smartlot.ar` (Cloudflare delante).
