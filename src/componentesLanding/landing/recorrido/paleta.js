// Colores de la maqueta 3D, con el nombre del token de DESIGN.md. WebGL no
// lee clases de Tailwind, así que la escena necesita los valores; una prueba
// de fuente verifica que coincidan con el frontmatter de DESIGN.md (excepción
// documentada en la Regla del Token).
export const PALETA = {
  'brand-surface': '#FFFFFF', // losa, muros y columnas
  'brand-deep': '#0C1E3F', // vehículo y brazo de la barrera
  'brand-warm': '#1E293B', // cabina del vehículo
  'brand-blue': '#2563EB', // trato activo y recorrido registrado
  'brand-sky': '#93C5FD', // plaza solicitada
  border: '#E2E8F0', // calle de acceso
  'border-strong': '#CBD5E1', // luz de la barrera apagada, guiones del carril
  'text-muted': '#94A3B8', // demarcación de las plazas
  success: '#22C55E', // acceso habilitado (siempre con texto en el panel)
};
