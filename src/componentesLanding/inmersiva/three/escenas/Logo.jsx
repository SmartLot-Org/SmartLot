import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BufferGeometry, EdgesGeometry, Float32BufferAttribute } from 'three';
import { geometriaLogo } from '../../../logo3d/geometriaLogo';
import { OFICINA } from '../mundo';
import { MAT } from '../paleta';
import { vivo } from '../vivo';

// Cierre: el logo de SmartLot en volumen, flotando sobre la oficina en el lugar
// que ocupaba el pin del hero (fx.logo). Sube desde la terraza, queda de frente
// a la cámara y se mece sin ponerse nunca de canto, para que la P siempre se lea.
const ALTO = 15;             // alto del logo en unidades del mundo
const FLOTA = 4.6;           // aire entre el pie del logo y la terraza
const TERRAZA = OFICINA.h + 0.03;
const DE_FRENTE = Math.PI / 4;   // la cámara mira en diagonal (x = z)

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
// Sale con un leve pasado y vuelve: entra con peso, como el pin al caer.
function conPasado(t) {
  const c = 1.6;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}

export function Logo() {
  const geo = useMemo(() => {
    const cuerpo = geometriaLogo({ profundidad: 0.07 });
    const hilo = new BufferGeometry();
    hilo.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, -1, 0], 3));
    return { cuerpo, aristas: new EdgesGeometry(cuerpo, 25), hilo };
  }, []);
  const raiz = useRef(null);
  const logo = useRef(null);
  const hilo = useRef(null);

  useFrame(() => {
    const { tiempo, mira, fx } = vivo;
    const t = limitar(fx.logo);
    raiz.current.visible = t > 0.01;
    if (!raiz.current.visible) return;

    const crece = conPasado(t);
    const alto = ALTO * Math.max(0.001, crece);
    const flota = Math.sin(tiempo * 1.2) * 0.3 * t;
    const pie = TERRAZA + FLOTA * t + flota;
    logo.current.position.y = pie + alto / 2;
    logo.current.scale.setScalar(alto);
    logo.current.rotation.set(
      mira.y * 0.1,
      DE_FRENTE + Math.sin(tiempo * 0.45) * 0.42 + mira.x * 0.35 + (1 - t) * 1.2,
      -mira.x * 0.06,
    );
    const opacidad = limitar(t * 1.6);
    MAT.logoCara.opacity = opacidad;
    MAT.logoLado.opacity = opacidad;
    MAT.logoLinea.opacity = opacidad;

    // Cota entre el pie del logo y la terraza, como el hilo del pin.
    hilo.current.position.y = pie;
    hilo.current.scale.y = Math.max(0.001, pie - TERRAZA);
    hilo.current.visible = t > 0.9;
  });

  return (
    <group ref={raiz} visible={false}>
      <group ref={logo}>
        <mesh geometry={geo.cuerpo} material={[MAT.logoCara, MAT.logoLado]} renderOrder={8} />
        <lineSegments geometry={geo.aristas} material={MAT.logoLinea} renderOrder={8} />
      </group>
      <lineSegments ref={hilo} geometry={geo.hilo} material={MAT.logoLinea} />
    </group>
  );
}
