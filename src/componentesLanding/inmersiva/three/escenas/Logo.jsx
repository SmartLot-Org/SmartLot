import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BufferGeometry, EdgesGeometry, Float32BufferAttribute } from 'three';
import { geometriaLogo } from '../../../logo3d/geometriaLogo';
import { OFICINA } from '../mundo';
import { MAT } from '../paleta';
import { vivo } from '../vivo';

// Cierre: el logo de SmartLot en volumen, flotando sobre quien recibe el relato
// (fx.logo). En la home es la oficina, en el lugar que ocupaba el pin del hero; en
// /para-garages, tu garage. Sube desde el techo de frente a la cámara y, cuando
// llega, gira en el lugar sobre su eje vertical, lento y constante. El giro avanza con
// el tiempo ambiental (vivo.tiempo), que con movimiento reducido no corre: ahí queda
// quieto y de frente.
const ALTO = 12;             // alto del logo en unidades del mundo
const FLOTA = 4.6;           // aire entre el pie del logo y el techo
const VUELTA = 10;           // segundos por vuelta
// Por defecto, la terraza de la oficina de la home: [x, alto del techo, z].
const SOBRE_LA_OFICINA = [0, OFICINA.h + 0.03, 0];
const DE_FRENTE = Math.PI / 4;   // la cámara mira en diagonal (x = z)

// Negativa: visto desde arriba gira en sentido horario (pedido del dueño del producto).
const VELOCIDAD = -(Math.PI * 2) / VUELTA;

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
// El giro entra suave apenas el logo se ve (no espera al final del tramo, que según
// el alto de la pantalla puede no completarse en el fondo de la página).
const llegada = (t) => {
  const u = limitar((t - 0.4) / 0.3);
  return u * u * (3 - 2 * u);
};
// Sale con un leve pasado y vuelve: entra con peso, como el pin al caer.
function conPasado(t) {
  const c = 1.6;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}

export function Logo({ base = SOBRE_LA_OFICINA, tamano = ALTO, aire = FLOTA }) {
  const [x, techo, z] = base;
  const geo = useMemo(() => {
    const cuerpo = geometriaLogo({ profundidad: 0.07 });
    const hilo = new BufferGeometry();
    hilo.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, -1, 0], 3));
    return { cuerpo, aristas: new EdgesGeometry(cuerpo, 25), hilo };
  }, []);
  const raiz = useRef(null);
  const logo = useRef(null);
  const hilo = useRef(null);
  // Ángulo acumulado del giro y último tiempo leído: se integra con el delta para que
  // al frenarse (scroll hacia atrás) quede donde estaba, sin saltar.
  const giro = useRef({ angulo: 0, tiempo: 0 });

  useFrame(() => {
    const { tiempo, mira, fx } = vivo;
    const t = limitar(fx.logo);
    const g = giro.current;
    const dt = tiempo - g.tiempo;
    g.tiempo = tiempo;
    raiz.current.visible = t > 0.01;
    if (!raiz.current.visible) {
      g.angulo = 0;    // la próxima vez vuelve a subir de frente
      return;
    }
    g.angulo = (g.angulo + VELOCIDAD * llegada(t) * Math.max(0, dt)) % (Math.PI * 2);

    const crece = conPasado(t);
    const alto = tamano * Math.max(0.001, crece);
    const pie = techo + aire * t;
    logo.current.position.y = pie + alto / 2;
    logo.current.scale.setScalar(alto);
    logo.current.rotation.set(
      mira.y * 0.1,
      DE_FRENTE + g.angulo + mira.x * 0.35 + (1 - t) * 1.2,
      -mira.x * 0.06,
    );
    const opacidad = limitar(t * 1.6);
    MAT.logoCara.opacity = opacidad;
    MAT.logoLado.opacity = opacidad;
    MAT.logoLinea.opacity = opacidad;

    // Cota entre el pie del logo y el techo, como el hilo del pin.
    hilo.current.position.y = pie;
    hilo.current.scale.y = Math.max(0.001, pie - techo);
    hilo.current.visible = t > 0.9;
  });

  return (
    <group ref={raiz} visible={false} position={[x, 0, z]}>
      <group ref={logo}>
        <mesh geometry={geo.cuerpo} material={[MAT.logoCara, MAT.logoLado]} renderOrder={8} />
        <lineSegments geometry={geo.aristas} material={MAT.logoLinea} renderOrder={8} />
      </group>
      <lineSegments ref={hilo} geometry={geo.hilo} material={MAT.logoLinea} />
    </group>
  );
}
