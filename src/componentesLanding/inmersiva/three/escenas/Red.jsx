import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { BufferAttribute, BufferGeometry } from 'three';
import { GARAGES } from '../mundo';
import { MAT } from '../paleta';
import { cintaPunteada, recorrido } from '../trazos';
import { vivo } from '../vivo';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// El garage del trato ya tiene su ruta: la red suma las de los otros seis.
const RUTAS = GARAGES.slice(1).map((g) => {
  const puntos = recorrido(g);
  const { caras } = cintaPunteada(puntos);
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(caras, 3));
  return { geo, triangulos: caras.length / 9 };
});

// La red en el cierre: desde la oficina se trazan, una tras otra, las rutas a
// los garages que se suman. Acompaña a fx.red.
export function Red() {
  const mallas = useRef([]);

  useFrame(() => {
    const { red, tapa } = vivo.fx;
    const visible = red > 0.01 && tapa < 0.05;
    MAT.red.opacity = 0.9;
    RUTAS.forEach((r, i) => {
      const malla = mallas.current[i];
      const avance = visible ? limitar(red * 1.7 - i * 0.12) : 0;
      malla.visible = avance > 0.001;
      malla.geometry.setDrawRange(0, Math.floor(r.triangulos * avance) * 3);
    });
  });

  return (
    <group>
      {RUTAS.map((r, i) => (
        <mesh key={i} ref={(el) => { mallas.current[i] = el; }} geometry={r.geo} material={MAT.red} renderOrder={5} visible={false} />
      ))}
    </group>
  );
}
