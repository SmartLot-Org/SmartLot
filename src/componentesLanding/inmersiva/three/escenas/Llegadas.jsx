import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { BufferAttribute, BufferGeometry } from 'three';
import { SEDES } from '../mundo';
import { MAT } from '../paleta';
import { cintaPunteada } from '../trazos';
import { vivo } from '../vivo';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// La sede del pedido ya tiene su ruta (la del trato): las llegadas suman las de las
// otras tres, desde la puerta de cada sede hasta el portón de tu garage.
const RUTAS = SEDES.slice(1).map((s) => {
  const { caras } = cintaPunteada(s.recorrido);
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(caras, 3));
  return { geo, triangulos: caras.length / 9 };
});

// El cierre de /para-garages: desde cada sede, una ruta punteada llega hasta tu
// garage, una tras otra. Acompaña a fx.llegan, como la red de la home a fx.red.
export function Llegadas() {
  const mallas = useRef([]);

  useFrame(() => {
    const { llegan, tapa, fuera } = vivo.fx;
    const visible = llegan > 0.01 && tapa < 0.05 && fuera < 0.99;
    MAT.llegada.opacity = 0.9 * (1 - fuera);
    RUTAS.forEach((r, i) => {
      const malla = mallas.current[i];
      const avance = visible ? limitar(llegan * 1.6 - i * 0.3) : 0;
      malla.visible = avance > 0.001;
      malla.geometry.setDrawRange(0, Math.floor(r.triangulos * avance) * 3);
    });
  });

  return (
    <group>
      {RUTAS.map((r, i) => (
        <mesh key={i} ref={(el) => { mallas.current[i] = el; }} geometry={r.geo} material={MAT.llegada} renderOrder={5} visible={false} />
      ))}
    </group>
  );
}
