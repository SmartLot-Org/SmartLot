import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { RingGeometry } from 'three';
import { MAT } from '../paleta';
import { vivo } from '../vivo';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ANILLO = new RingGeometry(0.96, 1, 96).rotateX(-Math.PI / 2);
const ALCANCE = 70;   // unidades: el radio final cubre la ciudad
const ONDAS = 3;
// Un material por anillo (cada uno con su opacidad); el color sigue a MAT.onda.
const MATERIALES = Array.from({ length: ONDAS }, () => MAT.onda.clone());

const DURA = 2.4;     // segundos que tarda la primera onda en llegar al borde

// El cierre: al llegar al final, desde la oficina salen ondas que barren la
// ciudad, como si el plano se aprobara de una vez. Corren con el tiempo (no
// con el scroll) y se vuelven a disparar si se sale y se vuelve al cierre.
// Con movimiento reducido vivo.tiempo no avanza y no se ven.
export function Onda() {
  const anillos = useRef([]);
  const inicio = useRef(null);

  useFrame(() => {
    const { final } = vivo.fx;
    if (final > 0.5 && inicio.current === null) inicio.current = vivo.tiempo;
    if (final < 0.2) inicio.current = null;
    const pasado = inicio.current === null ? -1 : (vivo.tiempo - inicio.current) / DURA;
    for (let k = 0; k < ONDAS; k++) {
      const a = anillos.current[k];
      const t = pasado < 0 ? 0 : limitar(pasado - k * 0.22);
      a.visible = t > 0.001 && t < 0.999;
      const r = 2 + (1 - (1 - t) ** 2) * ALCANCE;   // sale rápido y frena
      a.scale.set(r, 1, r);
      // Cada anillo se ensancha al alejarse y se apaga al llegar al borde.
      MATERIALES[k].color.copy(MAT.onda.color);
      MATERIALES[k].opacity = (1 - t) * 0.6;
    }
  });

  return (
    <group position={[0, 0.06, 0]}>
      {Array.from({ length: ONDAS }, (_, k) => (
        <mesh key={k} ref={(el) => { anillos.current[k] = el; }} geometry={ANILLO} material={MATERIALES[k]} renderOrder={6} visible={false} />
      ))}
    </group>
  );
}
