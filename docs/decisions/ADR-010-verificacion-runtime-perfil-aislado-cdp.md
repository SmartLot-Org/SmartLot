# ADR-010: Verificación runtime de la auditoría con perfil de navegador aislado y CDP

## Estado

Aceptado.

## Fecha

2026-10-22.

## Contexto

Los checks de runtime de la auditoría UI (P5/P6) necesitan rutas protegidas, y por lo tanto una sesión
real contra la API. En la sesión del 2026-10-22 el dueño ofreció su cuenta superadmin (inicio con Google) y
la función «Ingresar como» de Gestión de Usuarios para recorrer otros roles. El agente no tiene la extensión
de Chrome en la sesión, no debe manejar contraseñas ni extraer cookies del navegador personal, y el backend
local (`SmartLot_API`, puerto 3000) apunta a una base Supabase en la nube, es decir, datos reales.

Además, dos hechos de entorno condicionan el método: el `.cmd` del launcher de Impeccable y PowerShell para
ciertas operaciones están bloqueados por directiva de grupo de Windows, y las capturas con
`--virtual-time-budget` salen a mitad de las animaciones GSAP.

## Decisión

1. **Perfil aislado.** Se abre un Edge visible con `--remote-debugging-port` y un `--user-data-dir` propio
   (en el scratchpad de la sesión, nunca en el repositorio). **La persona inicia sesión ella misma** en esa
   ventana; el agente se conecta después por CDP. No se usan contraseñas, cookies ni sesiones del navegador
   personal.
2. **Solo lectura sobre datos reales.** Se navega y se captura; no se crea, edita ni borra nada. La
   suplantación («Ingresar como») se usa solo para ver vistas de otros roles. La sesión suplantada vence y
   obliga a reiniciar sesión: es esperado.
3. **Esperas reales y pestaña en primer plano.** Para vistas con GSAP se espera en tiempo real y se fuerza
   foco/visibilidad (`Emulation.setFocusEmulationEnabled` + `Page.bringToFront`); una pestaña en segundo plano
   (`visibilityState: hidden`) pausa las animaciones y produce falsos defectos («dashboard vacío»).
4. **Evidencia fuera del repo.** Capturas y scripts viven en Temp/scratchpad; en `docs/audit-ui/` se registran
   resultados y límites, sin datos personales de usuarios reales.
5. **Servidores efímeros.** El backend y `npm run dev` se levantan para la ronda y se apagan al terminar.

## Alternativas consideradas

### Usar la sesión de Chrome del dueño (cookies exportadas o perfil real)
- Pros: sin segundo inicio de sesión.
- Contras: implica extraer credenciales de sesión del navegador personal; riesgo de seguridad y de actuar con
  la identidad del dueño fuera de lo acordado.
- Rechazada.

### Pedir usuario y contraseña por chat
- Contras: credenciales en el historial de la conversación.
- Rechazada.

### Crear usuarios de prueba en la base
- Pros: cuentas dedicadas por rol, sin suplantar.
- Contras: escribe en una base compartida/real; requiere autorización explícita y limpieza posterior.
- Diferida: es la mejor opción para pruebas que sí deban escribir (checkout de Mercado Pago, QR).

## Consecuencias

- Cada ronda necesita que la persona inicie sesión (un clic en Google) en la ventana aislada.
- Las rondas sobre datos reales son de solo lectura; los checks que requieren escribir (P5 #5 QR con cámara,
  #6 Mercado Pago) siguen necesitando usuarios de prueba o un entorno de desarrollo propio.
- El detector de Impeccable sigue sin poder correr mientras el launcher esté bloqueado; no se reintenta.
- El procedimiento queda reutilizable por cualquier agente o persona que retome la auditoría.
