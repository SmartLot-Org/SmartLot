import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { geometria } from '../geometria';
import { MUNDO, PARADA_GARAGISTA, posicionAuto } from '../mundo';
import { MAT } from '../paleta';
import { vivo } from '../vivo';

// La entrada del garage a escala humana: el auto que avanza y el garagista en
// el portón. No hay barrera: no hace falta.
export function Acceso() {
  const geo = useMemo(() => ({
    coche: { caras: geometria(MUNDO.coche.caras), aristas: geometria(MUNDO.coche.aristas) },
    persona: { caras: geometria(MUNDO.persona.caras), aristas: geometria(MUNDO.persona.aristas) },
  }), []);
  const grupo = useRef(null);
  const auto = useRef(null);

  useFrame(() => {
    const { acceso, ingreso } = vivo.fx;
    grupo.current.visible = acceso > 0.01;
    if (!grupo.current.visible) return;
    MAT.papelAcceso.opacity = acceso;
    MAT.tintaAcceso.opacity = acceso;
    auto.current.position.z = posicionAuto(ingreso);
  });

  return (
    <group ref={grupo} visible={false}>
      <group ref={auto} position={[24, 0.02, posicionAuto(0)]} rotation-y={-Math.PI / 2}>
        <mesh geometry={geo.coche.caras} material={MAT.papelAcceso} />
        <lineSegments geometry={geo.coche.aristas} material={MAT.tintaAcceso} />
      </group>
      <group position={[PARADA_GARAGISTA[0], 0.02, PARADA_GARAGISTA[1]]}>
        <mesh geometry={geo.persona.caras} material={MAT.papelAcceso} />
        <lineSegments geometry={geo.persona.aristas} material={MAT.tintaAcceso} />
      </group>
    </group>
  );
}
