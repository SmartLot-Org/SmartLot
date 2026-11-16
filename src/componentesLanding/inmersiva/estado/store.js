import { create } from 'zustand';

// Estado DISCRETO de la landing (lo continuo va en scroll/rig.js).
// tier: 'high' | 'low' | 'static'
export const useUI = create((set) => ({
  seccion: 0,
  tier: 'high',
  sin3d: false,
  tema: 'claro',
  inicializado: false, // false hasta initUIFromBrowser: Landing no monta el 3D antes
  setSeccion: (seccion) => set({ seccion }),
  setTier: (tier) => set({ tier }),
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

// Se llama UNA vez en un efecto de Landing. Hasta entonces `inicializado` es false
// y el chunk 3D no se pide: con tier estático o con ?sin3d no se descarga nunca.
export function initUIFromBrowser() {
  const q = new URLSearchParams(window.location.search);
  useUI.setState({
    tier: initialTier(),
    sin3d: q.has('sin3d'),
    tema: q.get('tema') === 'cianotipo' ? 'cianotipo' : 'claro',
    inicializado: true,
  });
}
