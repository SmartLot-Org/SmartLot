import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { geometria } from '../geometria';
import { MUNDO } from '../mundo';
import { MAT } from '../paleta';
import { vivo } from '../vivo';

const salida = (t) => 1 - (1 - t) ** 3;

// El tejido de la ciudad: manzanas y edificios de contexto. Al cargar, el plano
// se dibuja desde la oficina hacia afuera.
export function Ciudad() {
  const geo = useMemo(() => ({
    manzanas: geometria(MUNDO.ciudad.manzanas),
    caras: geometria(MUNDO.ciudad.caras),
    cerca: geometria(MUNDO.ciudad.cerca),
    lejos: geometria(MUNDO.ciudad.lejos),
  }), []);
  const cerca = useRef(null);
  const total = MUNDO.ciudad.cerca.length / 3;

  useFrame(() => {
    cerca.current.geometry.setDrawRange(0, Math.floor((total * salida(vivo.intro)) / 2) * 2);
    MAT.lejos.opacity = Math.min(1, Math.max(0, (vivo.intro - 0.45) / 0.55));
  });

  return (
    <>
      <lineSegments geometry={geo.manzanas} material={MAT.tenue} />
      <mesh geometry={geo.caras} material={MAT.papel} />
      <lineSegments ref={cerca} geometry={geo.cerca} material={MAT.contexto} />
      <lineSegments geometry={geo.lejos} material={MAT.lejos} />
    </>
  );
}
