# Specs — flujo spec-driven de SmartLot

Toda feature nueva, ambigua o de más de ~30 minutos se especifica **antes** de planificar o codificar. La spec es el acuerdo de qué se construye, por qué y cómo se sabrá que está terminada. Ver también `AGENTS.md`.

## Flujo con puertas de aprobación

```
CAPACIDADES ──→ SPECIFY ──→ PLAN ──→ TAREAS ──→ IMPLEMENTAR
   (si aplica)     │          │         │            │
                   ▼          ▼         ▼            ▼
                revisión   revisión  revisión     revisión
                humana     humana    humana       humana
```

1. **Mapa de capacidades (solo si aplica).** Si un pedido agrupa varias capacidades verificables por separado (identidad, pagos, notificaciones, reportes...), primero se acuerda un mapa de módulos con ids estables, dependencias y orden de construcción. Sin él, cada spec razona sobre todo el contrato.
2. **Especificar.** Se escriben los seis núcleos (objetivo, comandos, estructura, estilo, pruebas, límites) más criterios de éxito y preguntas abiertas. Se explicitan los supuestos. **La spec se guarda y se detiene la sesión: no se planifica ni se codifica en el mismo turno.**
3. **Plan.** Con la spec aprobada, se define el enfoque técnico, el orden y los riesgos en `tasks/plan.md`.
4. **Tareas.** Se desglosa en tareas de una sesión, con criterio de aceptación y verificación cada una.
5. **Implementar.** De a una tarea por vez; al cerrar: `npm test`, lint dirigido y `npm run build` si es grande.

## Convención de nombres

| Artefacto | Ubicación | Nombre |
|---|---|---|
| Mapa de capacidades | `docs/specs/` | `MAP-<iniciativa>.md` |
| Spec de un módulo | `docs/specs/` | `SPEC-<module-id>.md` |
| Plan técnico | `tasks/` | `plan.md` |
| Lista de tareas | `tasks/` | `todo.md` |

El mapa es el índice de lo que existe: los `module-id` (kebab-case, estables) no se renombran a mitad de iniciativa.

## Reglas

- La spec es un documento vivo: si cambia una decisión o el alcance, se actualiza **antes** de implementar.
- No inventar requisitos: lo que no esté cubierto se anota en "Preguntas abiertas" y se consulta.
- Si una decisión de la spec cambia la arquitectura y es costosa de revertir, se registra además un ADR en `docs/decisions/` (ver `docs/decisions/README.md`).
- Las specs se commitean junto al código.

## Plantilla

Usar [`TEMPLATE.md`](./TEMPLATE.md).
