# Spec: [Nombre de la feature o módulo]

> Estado: Borrador | En revisión | Aprobada | Implementada
> Módulo: `<module-id>` (si hay mapa de capacidades)
> Última actualización: AAAA-MM-DD

## Objetivo

[Qué se construye y por qué. Usuario destinatario. Qué significa el éxito en una frase.]

**Criterios de aceptación:**

- [ ] [Condición verificable 1]
- [ ] [Condición verificable 2]

## Supuestos

[Listar los supuestos que se están tomando; corregir antes de aprobar.]

1. [...]

## Comandos

[Comandos ejecutables completos, no solo nombres de herramientas.]

```bash
npm run dev
npm test
npm run lint
npm run build
```

## Estructura del proyecto

[Dónde vive el código nuevo: carpetas de vistas por rol, componentes compartidos, servicios `API_*.js`, helpers con sus tests. Seguir las convenciones de `AGENTS.md`.]

- `src/vistas*/` → …
- `src/componentes*/` → …
- `src/servicies/` → …
- `src/helpers/` → … (+ test junto a la fuente)

## Estilo de código

[Un fragmento real de código vale más que tres párrafos. Incluir nombres, idioma del copy y un ejemplo del patrón a seguir (p. ej. un servicio que usa `apiClient` + `getFromCache`).]

```js
// Ejemplo del patrón esperado
```

## Estrategia de pruebas

- Framework: `node:test` (junto a la fuente).
- Nivel de cobertura esperado: [helpers/lógica pura con `*.test.js`; contratos de fuente con `*.source.test.js`; sin tests de render].
- Verificación manual: [pantallas y estados a revisar].

## Límites

- **Siempre:** [respetar `DESIGN.md`, reutilizar componentes compartidos, actualizar `docs/architecture.md` si hay rutas nuevas].
- **Preguntar antes de:** [nuevas dependencias, cambios de roles/rutas, tocar `apiClient`/caché].
- **Nunca:** [commitear secretos, asumir endpoints no verificados, borrar ADRs].

## Fuera de alcance

[Lo que explícitamente NO entra en esta spec.]

## Preguntas abiertas

- [ ] [Pregunta que necesita respuesta humana antes de planificar]
