import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { BufferAttribute, BufferGeometry } from 'three';
import { horaDe, ocupacionDe } from '../jornada';
import { GARAGES } from '../mundo';
import { MAT } from '../paleta';
import { vivo } from '../vivo';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const MARGEN = 0.35;

// Cuadrado unitario en el suelo (de 0 a 1 en x y z): cada garage lo escala.
const UNIDAD = new BufferGeometry();
UNIDAD.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1]), 3));

// Los tres garages marcados desde el inicio.
const MARCADOS = GARAGES.slice(0, 3);

// La jornada: sobre el techo de cada garage, una barra que se llena con los
// autos que entran y se vacía a la tarde. Acompaña a fx.hora.
export function Jornada() {
  const barras = useRef([]);

  useFrame(() => {
    const { hora, red, tapa } = vivo.fx;
    const presencia = limitar(hora * 25) * (1 - limitar(red * 4)) * (1 - limitar(tapa * 2));
    MAT.ocupa.opacity = presencia * 0.85;
    const h = horaDe(hora);
    MARCADOS.forEach((g, i) => {
      const b = barras.current[i];
      const o = ocupacionDe(i, h);
      b.visible = presencia > 0.01 && o > 0.005;
      const largo = (g.z1 - g.z0 - MARGEN * 2) * o;
      b.position.set(g.x0 + MARGEN, g.h + 0.05, g.z1 - MARGEN - largo);
      b.scale.set(g.x1 - g.x0 - MARGEN * 2, 1, Math.max(0.001, largo));
    });
  });

  return (
    <group>
      {MARCADOS.map((g, i) => (
        <mesh key={i} ref={(el) => { barras.current[i] = el; }} geometry={UNIDAD} material={MAT.ocupa} renderOrder={4} visible={false} />
      ))}
    </group>
  );
}
