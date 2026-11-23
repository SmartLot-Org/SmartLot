import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { geometria } from '../geometria';
import { MUNDO } from '../mundo';
import { MAT, tenirSumados } from '../paleta';
import { vivo } from '../vivo';

// La oficina, los garages y el recorrido que los une. El azul señal aparece
// solo donde hay un lugar para vos: el contorno de un garage con plazas, el
// recorrido y el techo del garage que aceptó el trato.
// En /para-garages el garage del trato es tu garage: mientras está fuera del mapa
// (fx.fuera) va en línea de trazos y tinta tenue, sin nada azul.
export function Trato() {
  const geo = useMemo(() => {
    const de = (m) => ({ caras: geometria(m.caras), aristas: geometria(m.aristas), techos: m.techos && geometria(m.techos) });
    return {
      oficina: de(MUNDO.oficina), trato: de(MUNDO.trato), otros: de(MUNDO.otros), sumados: de(MUNDO.sumados), ruta: geometria(MUNDO.ruta.cinta),
      // Aparte: la línea de trazos suma su propio atributo de distancias.
      fuera: geometria(MUNDO.trato.aristas),
    };
  }, []);
  const ruta = useRef(null);
  const trato = useRef(null);
  const techoTrato = useRef(null);
  const techosOtros = useRef(null);
  const trazos = useRef(null);
  const totalRuta = MUNDO.ruta.cinta.length / 3;

  useLayoutEffect(() => { trazos.current.computeLineDistances(); }, []);

  useFrame(() => {
    const { traza, trato: aceptado, red, fuera } = vivo.fx;
    // El techo termina de irse un poco antes que el resto, para que la planta quede limpia.
    const tapa = Math.min(1, vivo.fx.tapa * 1.25);
    const enElMapa = 1 - fuera;
    MAT.tinta.opacity = vivo.aparecen;
    MAT.senalLinea.opacity = vivo.aparecen;

    // A escala de plaza, el recorrido y el volumen del garage estorban: se retiran.
    ruta.current.geometry.setDrawRange(0, Math.floor((totalRuta * traza) / 3) * 3);
    MAT.ruta.opacity = (1 - tapa) * enElMapa;
    ruta.current.visible = traza > 0.001 && tapa < 0.99 && fuera < 0.99;

    MAT.papelTrato.opacity = 1 - tapa;
    MAT.tratoLinea.opacity = vivo.aparecen * (1 - tapa) * enElMapa;
    trato.current.visible = tapa < 0.99;
    MAT.techoTrato.opacity = aceptado * (1 - tapa) * enElMapa;
    techoTrato.current.visible = MAT.techoTrato.opacity > 0.01;
    MAT.fueraLinea.opacity = vivo.aparecen * (1 - tapa) * fuera;
    trazos.current.visible = MAT.fueraLinea.opacity > 0.01;

    MAT.techoOtros.opacity = red;
    techosOtros.current.visible = red > 0.01;
    tenirSumados(red);
  });

  return (
    <>
      <mesh geometry={geo.oficina.caras} material={MAT.papel} />
      <lineSegments geometry={geo.oficina.aristas} material={MAT.tinta} />

      <mesh geometry={geo.otros.caras} material={MAT.papel} />
      <lineSegments geometry={geo.otros.aristas} material={MAT.senalLinea} />
      <mesh geometry={geo.sumados.caras} material={MAT.papel} />
      <lineSegments geometry={geo.sumados.aristas} material={MAT.sumadosLinea} />
      <group ref={techosOtros} visible={false}>
        <mesh geometry={geo.otros.techos} material={MAT.techoOtros} />
        <mesh geometry={geo.sumados.techos} material={MAT.techoOtros} />
      </group>

      <group ref={trato}>
        <mesh geometry={geo.trato.caras} material={MAT.papelTrato} />
        <lineSegments geometry={geo.trato.aristas} material={MAT.tratoLinea} />
        <lineSegments ref={trazos} geometry={geo.fuera} material={MAT.fueraLinea} visible={false} />
      </group>
      <mesh ref={techoTrato} geometry={geo.trato.techos} material={MAT.techoTrato} visible={false} />

      <mesh ref={ruta} geometry={geo.ruta} material={MAT.ruta} renderOrder={5} visible={false} />
    </>
  );
}
