import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { geometria } from '../geometria';
import { caja, rectangulo, SEDES } from '../mundo';
import { MAT } from '../paleta';
import { vivo } from '../vivo';

const MARGEN = 0.03;   // apenas más grande que el edificio: tapa sus aristas en tinta media
const PISO = 1.2;      // la misma altura de piso que la oficina de la home

// Las sedes de las empresas (/para-garages): tres edificios de la ciudad pasan a tinta
// plena con líneas de piso, como la oficina, que es la cuarta y ya se dibuja así
// (Trato.jsx). Una sede nunca va en azul: el azul es de los lugares disponibles.
const VOLUMENES = (() => {
  const caras = [];
  const aristas = [];
  for (const s of SEDES.slice(1)) {
    const [x0, z0, x1, z1] = [s.x0 - MARGEN, s.z0 - MARGEN, s.x1 + MARGEN, s.z1 + MARGEN];
    caja(caras, aristas, x0, z0, x1, z1, s.h + MARGEN);
    for (let piso = PISO; piso < s.h - 0.3; piso += PISO) rectangulo(aristas, x0, z0, x1, z1, piso);
  }
  return { caras: new Float32Array(caras), aristas: new Float32Array(aristas) };
})();

export function Sedes() {
  const geo = useMemo(() => ({ caras: geometria(VOLUMENES.caras), aristas: geometria(VOLUMENES.aristas) }), []);
  const grupo = useRef(null);

  useFrame(() => {
    // Aparecen con la tinta plena del plano, cuando termina de dibujarse.
    const o = vivo.fx.sedes * vivo.aparecen;
    grupo.current.visible = o > 0.01;
    MAT.sedeCara.opacity = o;
    MAT.sedeLinea.opacity = o;
  });

  return (
    <group ref={grupo} visible={false}>
      <mesh geometry={geo.caras} material={MAT.sedeCara} />
      <lineSegments geometry={geo.aristas} material={MAT.sedeLinea} />
    </group>
  );
}
