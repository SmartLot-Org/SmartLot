import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { DIBUJO, MARGEN as M, UBICACION } from '../alta';
import { geometria } from '../geometria';
import { G1 } from '../mundo';
import { MAT } from '../paleta';
import { vivo } from '../vivo';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const TRAMOS = 10;        // cada arista se dibuja en tramos cortos: se ve el trazo avanzar

// Las aristas de tu garage en el orden en que se dibujan (base, verticales y techo) y,
// al final, la marca de la ubicación sobre el techo: un punto del mapa.
const TRAZO = (() => {
  const [x0, z0, x1, z1, h] = [G1.x0 - M, G1.z0 - M, G1.x1 + M, G1.z1 + M, G1.h + M];
  const esquinas = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  const aristas = [];
  esquinas.forEach(([x, z], i) => { const [xb, zb] = esquinas[(i + 1) % 4]; aristas.push([[x, 0, z], [xb, 0, zb]]); });
  esquinas.forEach(([x, z]) => aristas.push([[x, 0, z], [x, h, z]]));
  esquinas.forEach(([x, z], i) => { const [xb, zb] = esquinas[(i + 1) % 4]; aristas.push([[x, h, z], [xb, h, zb]]); });
  const lineas = [];
  for (const [a, b] of aristas) {
    for (let k = 0; k < TRAMOS; k++) {
      const t0 = k / TRAMOS;
      const t1 = (k + 1) / TRAMOS;
      for (const t of [t0, t1]) lineas.push(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
    }
  }
  // La ubicación: una cruz con un círculo, en el centro del techo.
  const [cx, y, cz] = UBICACION;
  lineas.push(cx - 0.75, y, cz, cx + 0.75, y, cz, cx, y, cz - 0.75, cx, y, cz + 0.75);
  const LADOS = 24;
  for (let i = 0; i < LADOS; i++) {
    const a0 = (i / LADOS) * Math.PI * 2;
    const a1 = ((i + 1) / LADOS) * Math.PI * 2;
    lineas.push(cx + Math.cos(a0) * 0.42, y, cz + Math.sin(a0) * 0.42, cx + Math.cos(a1) * 0.42, y, cz + Math.sin(a1) * 0.42);
  }
  return new Float32Array(lineas);
})();

// El alta de tu garage (/para-garages): el volumen se dibuja arista por arista en tinta
// plena, sobre la línea de trazos de cuando estaba fuera del mapa. Las cotas con los
// datos del alta son HTML (CotasAlta.jsx). Cuando tu garage entra al mapa (fuera en 0)
// las aristas dejan lugar al contorno azul de Trato.jsx.
export function Alta() {
  const geo = useMemo(() => geometria(TRAZO), []);
  const trazo = useRef(null);
  const total = TRAZO.length / 6;

  useFrame(() => {
    const { alta, fuera } = vivo.fx;
    const o = vivo.aparecen * fuera;
    trazo.current.visible = alta > 0.001 && o > 0.01;
    if (!trazo.current.visible) return;
    MAT.altaLinea.opacity = o;
    trazo.current.geometry.setDrawRange(0, Math.ceil(total * limitar(alta / DIBUJO)) * 2);
  });

  return <lineSegments ref={trazo} geometry={geo} material={MAT.altaLinea} visible={false} />;
}
