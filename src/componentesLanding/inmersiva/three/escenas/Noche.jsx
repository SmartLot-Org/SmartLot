import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { geometria } from '../geometria';
import { azar, EDIFICIOS, OFICINA } from '../mundo';
import { MAT } from '../paleta';
import { vivo } from '../vivo';

// De noche (tema cianotipo) se encienden ventanas: todas las de la oficina y
// algunas de los edificios cercanos. Solo las caras que mira la cámara (+X y +Z).
const SALIENTE = 0.012;

function ventana(caras, cara, a0, a1, y0, y1, fijo) {
  if (cara === 'x') {
    caras.push(fijo, y0, a0, fijo, y0, a1, fijo, y1, a1, fijo, y0, a0, fijo, y1, a1, fijo, y1, a0);
  } else {
    caras.push(a0, y0, fijo, a1, y0, fijo, a1, y1, fijo, a0, y0, fijo, a1, y1, fijo, a0, y1, fijo);
  }
}

function construirVentanas() {
  const caras = [];
  const rng = azar(77);
  // Oficina: una ventana corrida por piso y por cara, partida en tres.
  for (let piso = 0.35; piso < OFICINA.h - 0.6; piso += 1.2) {
    for (let k = 0; k < 3; k++) {
      const a0 = OFICINA.x0 + 0.3 + k * 1.33;
      const a1 = a0 + 1.05;
      if (rng() < 0.85) ventana(caras, 'x', OFICINA.z0 + 0.3 + k * 1.33, OFICINA.z0 + 1.35 + k * 1.33, piso, piso + 0.55, OFICINA.x1 + SALIENTE);
      if (rng() < 0.85) ventana(caras, 'z', a0, a1, piso, piso + 0.55, OFICINA.z1 + SALIENTE);
    }
  }
  // Edificios cercanos y altos: ventanas sueltas.
  for (const e of EDIFICIOS) {
    if (e.d > 60 || e.h < 2) continue;
    for (let y = 0.4; y < e.h - 0.5; y += 0.9) {
      for (const [cara, desde, hasta, fijo] of [['x', e.z0, e.z1, e.x1 + SALIENTE], ['z', e.x0, e.x1, e.z1 + SALIENTE]]) {
        const ancho = hasta - desde;
        const n = Math.max(1, Math.floor(ancho / 1.1));
        for (let k = 0; k < n; k++) {
          if (rng() > 0.22) continue;
          const a0 = desde + 0.25 + (k * (ancho - 0.5)) / n;
          ventana(caras, cara, a0, a0 + Math.min(0.6, (ancho - 0.5) / n - 0.15), y, y + 0.38, fijo);
        }
      }
    }
  }
  return new Float32Array(caras);
}

const VENTANAS = construirVentanas();

export function Noche() {
  const geo = useMemo(() => geometria(VENTANAS), []);
  const malla = useRef(null);

  useFrame(() => {
    const n = vivo.noche * vivo.aparecen * (1 - Math.min(1, vivo.fx.tapa * 2));
    malla.current.visible = n > 0.01;
    // Un parpadeo muy leve, como luz de oficina.
    MAT.luz.opacity = n * (0.78 + Math.sin(vivo.tiempo * 0.7) * 0.04);
  });

  return <mesh ref={malla} geometry={geo} material={MAT.luz} visible={false} />;
}
