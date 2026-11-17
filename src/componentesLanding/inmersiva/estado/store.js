import { create } from 'zustand';

// Estado DISCRETO de la landing (lo continuo va en scroll/rig.js).
// tier: 'high' | 'low' | 'static'
export const useUI = create((set) => ({
  seccion: 0,
  tier: 'high',
  sin3d: false,
  inicializado: false, // false hasta asegurarInicio: Landing no monta el 3D antes
  contextoPerdido: false,
  setSeccion: (seccion) => set({ seccion }),
  setTier: (tier) => set({ tier }),
  perderContexto: () => set({ tier: 'static', contextoPerdido: true }),
  alternarSin3d: () => set((s) => ({ sin3d: !s.sin3d })),
}));

// Tier de arranque: sin WebGL o con ahorro de datos → 'static'; equipo modesto → 'low'.
// PerformanceMonitor lo ajusta después según el FPS real.
export function initialTier() {
  let webgl = false;
  try { webgl = !!document.createElement('canvas').getContext('webgl2'); } catch { /* sin WebGL */ }
  if (!webgl) return 'static';
  if (navigator.connection?.saveData) return 'static';
  const pocaMemoria = (navigator.deviceMemory ?? 8) <= 2;
  const pocosNucleos = (navigator.hardwareConcurrency ?? 8) <= 2;
  return pocaMemoria || pocosNucleos ? 'low' : 'high';
}

// Se llama antes del primer render de Landing (la app no tiene SSR, así que el
// navegador ya está disponible). Decidir acá, y no en un efecto, evita dos cosas:
// que el chunk 3D se pida cuando no se va a usar (tier estático o ?sin3d) y que
// el layout salte del modo con 3D al modo sin 3D después de pintar.
export function asegurarInicio() {
  const estado = useUI.getState();
  if (!estado.inicializado) {
    initUIFromBrowser();
    return;
  }
  // Una pérdida del contexto WebGL vale para esa visita: al volver a la landing se
  // intenta el 3D otra vez con el tier que se midió al llegar.
  if (estado.contextoPerdido) useUI.setState({ tier: tierDeLlegada, contextoPerdido: false });
}

let tierDeLlegada = 'high';

function initUIFromBrowser() {
  const q = new URLSearchParams(window.location.search);
  tierDeLlegada = initialTier();
  useUI.setState({
    tier: tierDeLlegada,
    sin3d: q.has('sin3d'),
    inicializado: true,
  });
}
