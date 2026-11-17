import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { azar, EDIFICIOS, LIMITE_CIUDAD } from '../mundo';
import { geometria } from '../geometria';
import { MAT } from '../paleta';
import { vivo } from '../vivo';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
// Dirección de la luz sobre el suelo, por unidad de altura: las sombras caen
// hacia +X y −Z, del lado que ve la cámara.
const LUZ = [0.55, -0.32];

// ── Sombras de los edificios: la envolvente convexa de la planta y su
// proyección, en un solo dibujo. Estáticas: el sol no se mueve. ──
function envolvente(puntos) {
  const p = [...puntos].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cruz = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const abajo = [];
  for (const q of p) { while (abajo.length >= 2 && cruz(abajo.at(-2), abajo.at(-1), q) <= 0) abajo.pop(); abajo.push(q); }
  const arriba = [];
  for (const q of [...p].reverse()) { while (arriba.length >= 2 && cruz(arriba.at(-2), arriba.at(-1), q) <= 0) arriba.pop(); arriba.push(q); }
  return abajo.slice(0, -1).concat(arriba.slice(0, -1));
}
function construirSombras() {
  const caras = [];
  for (const e of EDIFICIOS) {
    const dx = LUZ[0] * e.h;
    const dz = LUZ[1] * e.h;
    const base = [[e.x0, e.z0], [e.x1, e.z0], [e.x1, e.z1], [e.x0, e.z1]];
    const poli = envolvente([...base, ...base.map(([x, z]) => [x + dx, z + dz])]);
    for (let i = 1; i < poli.length - 1; i++) {
      for (const [x, z] of [poli[0], poli[i], poli[i + 1]]) caras.push(x, 0.012, z);
    }
  }
  return new Float32Array(caras);
}

// ── Nubes: unión de círculos en un plano alto, con contorno en tinta y su
// sombra en el suelo. Cruzan el plano despacio, de oeste a este. ──
const ALTURA_NUBE = 22;
function construirNube(rng) {
  const circulos = Array.from({ length: 3 + Math.floor(rng() * 3) }, (_, i) => [
    (i - 1.5) * 2.2 + rng() * 1.2, (rng() - 0.5) * 2.4, 2 + rng() * 1.8,
  ]);
  // Contorno: los puntos de cada círculo que no caen dentro de otro, ordenados por ángulo.
  const cx = circulos.reduce((s, c) => s + c[0], 0) / circulos.length;
  const cz = circulos.reduce((s, c) => s + c[1], 0) / circulos.length;
  const borde = [];
  for (const [x, z, r] of circulos) {
    for (let k = 0; k < 40; k++) {
      const a = (k / 40) * Math.PI * 2;
      const p = [x + Math.cos(a) * r, z + Math.sin(a) * r];
      if (circulos.every(([x2, z2, r2]) => (x2 === x && z2 === z) || Math.hypot(p[0] - x2, p[1] - z2) >= r2 - 1e-3)) borde.push(p);
    }
  }
  borde.sort((a, b) => Math.atan2(a[1] - cz, a[0] - cx) - Math.atan2(b[1] - cz, b[0] - cx));
  const relleno = [];
  const linea = [];
  for (let i = 0; i < borde.length; i++) {
    const [a, b] = [borde[i], borde[(i + 1) % borde.length]];
    relleno.push(cx, 0, cz, a[0], 0, a[1], b[0], 0, b[1]);
    linea.push(a[0], 0, a[1], b[0], 0, b[1]);
  }
  return { relleno: new Float32Array(relleno), linea: new Float32Array(linea) };
}
const rng = azar(91);
const NUBES = Array.from({ length: 6 }, (_, i) => ({
  ...construirNube(rng),
  z: -60 + i * 22 + rng() * 8,
  fase: rng(),
  velocidad: 0.9 + rng() * 0.6,
  escala: 1.2 + rng() * 0.9,
}));
const SOMBRAS = construirSombras();

export function Clima() {
  const geo = useMemo(() => ({
    sombras: geometria(SOMBRAS),
    nubes: NUBES.map((n) => ({ relleno: geometria(n.relleno), linea: geometria(n.linea) })),
  }), []);
  const sombras = useRef(null);
  const nubes = useRef([]);
  const largo = LIMITE_CIUDAD * 2 + 40;

  useFrame(() => {
    const { tapa, acceso } = vivo.fx;
    const ciudad = vivo.aparecen * (1 - limitar(tapa * 2)) * (1 - acceso);
    // De noche no hay sombras de sol; las nubes siguen, más tenues.
    MAT.sombra.opacity = ciudad * (1 - vivo.noche) * 0.07;
    sombras.current.visible = MAT.sombra.opacity > 0.002;
    MAT.nube.opacity = ciudad * (0.88 - vivo.noche * 0.3);
    MAT.nubeLinea.opacity = ciudad * (0.9 - vivo.noche * 0.4);
    MAT.nubeSombra.opacity = ciudad * (1 - vivo.noche) * 0.06;
    NUBES.forEach((n, i) => {
      const g = nubes.current[i];
      g.visible = ciudad > 0.01;
      if (!g.visible) return;
      const x = ((n.fase * largo + vivo.tiempo * n.velocidad) % largo) - largo / 2;
      g.position.set(x, 0, n.z);
      g.scale.set(n.escala, 1, n.escala);
    });
  });

  return (
    <>
      <mesh ref={sombras} geometry={geo.sombras} material={MAT.sombra} />
      {NUBES.map((n, i) => (
        <group key={i} ref={(el) => { nubes.current[i] = el; }}>
          <mesh geometry={geo.nubes[i].relleno} material={MAT.nubeSombra} position={[LUZ[0] * ALTURA_NUBE, 0.015, LUZ[1] * ALTURA_NUBE]} />
          <group position-y={ALTURA_NUBE}>
            <mesh geometry={geo.nubes[i].relleno} material={MAT.nube} renderOrder={9} />
            <lineSegments geometry={geo.nubes[i].linea} material={MAT.nubeLinea} renderOrder={9} />
          </group>
        </group>
      ))}
    </>
  );
}
