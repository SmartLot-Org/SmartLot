import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { geometria } from '../geometria';
import { MUNDO, puntoEnVuelta } from '../mundo';
import { MAT } from '../paleta';
import { vivo } from '../vivo';

// Fase inicial de cada auto sobre el circuito (fracción de vuelta) y su ritmo.
const AUTOS = [[0.04, 1], [0.31, 0.86], [0.42, 1.12], [0.71, 0.94], [0.88, 1.05]];
const VELOCIDAD = 1.5; // unidades por segundo

// El problema: autos dando vueltas a la manzana de la oficina. La trayectoria
// punteada es la notación de recorrido de un plano; el movimiento es ambiental
// y se detiene con movimiento reducido (los autos quedan en su lugar).
export function Vueltas() {
  const geo = useMemo(() => ({
    caras: geometria(MUNDO.coche.caras),
    aristas: geometria(MUNDO.coche.aristas),
    vuelta: geometria(MUNDO.vuelta.linea),
  }), []);
  const grupo = useRef(null);
  const linea = useRef(null);
  const autos = useRef([]);
  const p = useMemo(() => ({ x: 0, z: 0, rumbo: 0 }), []);
  const total = MUNDO.vuelta.linea.length / 3;

  useLayoutEffect(() => { linea.current.computeLineDistances(); }, []);

  useFrame(() => {
    const v = vivo.fx.vueltas;
    grupo.current.visible = v > 0.005;
    if (!grupo.current.visible) return;
    MAT.vueltaLinea.opacity = v;
    MAT.papelVuelta.opacity = v;
    MAT.tintaVuelta.opacity = v;
    linea.current.geometry.setDrawRange(0, Math.floor((total * Math.min(1, v * 1.4)) / 2) * 2);
    AUTOS.forEach(([fase, ritmo], i) => {
      const auto = autos.current[i];
      puntoEnVuelta(MUNDO.vuelta, fase * MUNDO.vuelta.largo + vivo.tiempo * VELOCIDAD * ritmo, p);
      auto.position.set(p.x, 0.03, p.z);
      auto.rotation.y = p.rumbo;
    });
  });

  return (
    <group ref={grupo} visible={false}>
      <lineSegments ref={linea} geometry={geo.vuelta} material={MAT.vueltaLinea} />
      {AUTOS.map((_, i) => (
        <group key={i} ref={(el) => { autos.current[i] = el; }} scale={1.9}>
          <mesh geometry={geo.caras} material={MAT.papelVuelta} />
          <lineSegments geometry={geo.aristas} material={MAT.tintaVuelta} />
        </group>
      ))}
    </group>
  );
}
