import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { geometria } from '../geometria';
import { MUNDO, puntoEnEstaciona } from '../mundo';
import { MAT } from '../paleta';
import { vivo } from '../vivo';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
// Arranca y frena suave, como un auto de verdad buscando su lugar.
const suave = (t) => (t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2);

// Con el techo levantado, un auto entra por el portón, recorre la calle interna
// y se estaciona de punta en una de las plazas del trato. Avanza con el scroll
// (fx.estaciona): es reversible como el resto del relato.
export function Estaciona() {
  const geo = useMemo(() => ({ caras: geometria(MUNDO.coche.caras), aristas: geometria(MUNDO.coche.aristas) }), []);
  const auto = useRef(null);
  const p = useMemo(() => ({ x: 0, z: 0, rumbo: 0 }), []);

  useFrame(() => {
    const { tapa, consumos, estaciona } = vivo.fx;
    const o = limitar((tapa - 0.5) * 2) * (1 - limitar(consumos * 4));
    auto.current.visible = o > 0.01;
    if (!auto.current.visible) return;
    MAT.papelEstaciona.opacity = o;
    MAT.tintaEstaciona.opacity = o;
    puntoEnEstaciona(suave(estaciona), p);
    auto.current.position.set(p.x, 0.02, p.z);
    auto.current.rotation.y = p.rumbo;
  });

  return (
    <group ref={auto} visible={false}>
      <mesh geometry={geo.caras} material={MAT.papelEstaciona} />
      <lineSegments geometry={geo.aristas} material={MAT.tintaEstaciona} />
    </group>
  );
}
