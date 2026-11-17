import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { geometria } from '../geometria';
import { MUNDO, RESERVADAS } from '../mundo';
import { MAT } from '../paleta';
import { vivo } from '../vivo';

// El garage por dentro: se levanta el techo y queda la planta. Las plazas del
// trato se pintan de azul a medida que se reservan y, en la prueba, sobre cada
// una se apilan las horas de estadía.
export function Garage() {
  const geo = useMemo(() => {
    const { planta } = MUNDO;
    return {
      muro: geometria(planta.muro), lineas: geometria(planta.lineas), flechas: geometria(planta.flechas),
      ajenos: geometria(planta.ajenos), rellenos: geometria(planta.rellenos),
      lados: geometria(planta.consumos.lados), tapas: geometria(planta.consumos.tapas), aristas: geometria(planta.consumos.aristas),
    };
  }, []);
  const planta = useRef(null);
  const plazas = useRef(null);
  const pilas = useRef(null);
  const lados = useRef(null);
  const tapas = useRef(null);
  const aristas = useRef(null);
  const losas = MUNDO.planta.consumos.losas;

  useFrame(() => {
    const { tapa, llenas, consumos } = vivo.fx;
    planta.current.visible = tapa > 0.01;
    MAT.plantaLinea.opacity = tapa;
    MAT.plantaTenue.opacity = tapa;

    const n = Math.round(RESERVADAS * llenas);
    plazas.current.visible = tapa > 0.5 && n > 0;
    plazas.current.geometry.setDrawRange(0, n * 6);

    const k = Math.round(losas * consumos);
    pilas.current.visible = tapa > 0.5 && k > 0;
    lados.current.geometry.setDrawRange(0, k * 24);
    tapas.current.geometry.setDrawRange(0, k * 6);
    aristas.current.geometry.setDrawRange(0, k * 24);
  });

  return (
    <>
      <group ref={planta} visible={false}>
        <lineSegments geometry={geo.muro} material={MAT.plantaLinea} />
        <lineSegments geometry={geo.lineas} material={MAT.plantaLinea} />
        <lineSegments geometry={geo.flechas} material={MAT.plantaTenue} />
        <lineSegments geometry={geo.ajenos} material={MAT.plantaTenue} />
      </group>
      <mesh ref={plazas} geometry={geo.rellenos} material={MAT.plazas} visible={false} />
      <group ref={pilas} visible={false}>
        <mesh ref={lados} geometry={geo.lados} material={MAT.losaLado} />
        <mesh ref={tapas} geometry={geo.tapas} material={MAT.losaTapa} />
        <lineSegments ref={aristas} geometry={geo.aristas} material={MAT.losaLinea} />
      </group>
    </>
  );
}
