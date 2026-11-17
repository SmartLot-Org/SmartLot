import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BufferGeometry, EdgesGeometry, ExtrudeGeometry, Float32BufferAttribute, Path, RingGeometry, Shape } from 'three';
import { OFICINA } from '../mundo';
import { MAT } from '../paleta';
import { vivo } from '../vivo';

// Protagonista del hero: el pin de "acá hay lugar", en volumen, flotando sobre
// la oficina. Cae con rebote cuando el plano termina de dibujarse, gira lento,
// se inclina hacia el cursor y emite una onda sobre la terraza. Se guarda al
// pasar al problema y vuelve en el cierre (fx.pinFuera).
const R = 1;                 // radio de la cabeza
const C = 1.75;              // altura del centro de la cabeza sobre la punta
const ESCALA = 4.6;
const FLOTA = 4.2;           // altura de la punta sobre la terraza
const CAIDA = 22;            // desde dónde cae
const TERRAZA = OFICINA.h + 0.03;

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
function rebote(t) {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
}

function formaPin() {
  const alfa = Math.acos(R / C);       // ángulo entre "abajo" y el punto de tangencia
  const s = new Shape();
  s.moveTo(0, 0);
  const desde = -Math.PI / 2 + alfa;
  const hasta = (3 * Math.PI) / 2 - alfa;
  s.lineTo(Math.cos(desde) * R, C + Math.sin(desde) * R);
  s.absarc(0, C, R, desde, hasta, false);
  s.lineTo(0, 0);
  const ojo = new Path();
  ojo.absarc(0, C, R * 0.42, 0, Math.PI * 2, true);
  s.holes.push(ojo);
  const g = new ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: false, curveSegments: 28 });
  g.translate(0, 0, -0.25);
  return g;
}

// Materiales de las ondas: del módulo, se escriben en cada frame.
const mats = { o1: MAT.pulso.clone(), o2: MAT.pulso.clone() };

export function Pin() {
  const geo = useMemo(() => {
    const cuerpo = formaPin();
    const hilo = new BufferGeometry();
    hilo.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, -1, 0], 3));
    return {
      cuerpo,
      aristas: new EdgesGeometry(cuerpo, 25),
      hilo,
      onda: new RingGeometry(0.92, 1, 48).rotateX(-Math.PI / 2),
    };
  }, []);
  const raiz = useRef(null);
  const pin = useRef(null);
  const hilo = useRef(null);
  const onda = useRef(null);
  const onda2 = useRef(null);
  const llegada = useRef(null);

  useFrame(() => {
    const { tiempo, aparecen, mira, fx } = vivo;
    const fuera = fx.pinFuera;
    const presente = aparecen * (1 - fuera);
    raiz.current.visible = presente > 0.01;
    if (!raiz.current.visible) return;

    // La caída arranca cuando el plano ya apareció; con movimiento reducido llega quieto.
    if (llegada.current === null && aparecen > 0.95) llegada.current = tiempo;
    const t = llegada.current === null ? 0 : limitar((tiempo - llegada.current) / 1.15);
    const cayo = vivo.tiempo === 0 ? 1 : rebote(t);
    const flota = Math.sin(tiempo * 1.4) * 0.35 * cayo;
    const altura = TERRAZA + FLOTA + flota + (1 - cayo) * CAIDA + fuera * 6;

    const escala = ESCALA * (1 - fuera * fuera * (3 - 2 * fuera));
    pin.current.position.y = altura;
    pin.current.scale.setScalar(Math.max(0.001, escala));
    pin.current.rotation.set(mira.y * 0.12, tiempo * 0.55 + mira.x * 0.8, -mira.x * 0.14);
    MAT.pinCara.opacity = presente;
    MAT.pinLado.opacity = presente;
    MAT.pinLinea.opacity = presente;

    // Hilo entre la punta y la terraza, como una cota.
    hilo.current.position.y = altura;
    hilo.current.scale.y = Math.max(0.001, altura - TERRAZA);
    hilo.current.visible = cayo > 0.98;

    // Ondas en la terraza, desfasadas.
    for (const [ref, m, k] of [[onda, mats.o1, 0], [onda2, mats.o2, 0.5]]) {
      const fase = (tiempo / 2.2 + k) % 1;
      m.color.copy(MAT.pulso.color);
      m.opacity = presente * cayo * 0.7 * (1 - fase) ** 2;
      ref.current.scale.setScalar(1.2 + fase * 5);
    }
  });

  return (
    <group ref={raiz} position={[0, 0, 0]} visible={false}>
      <group ref={pin}>
        <mesh geometry={geo.cuerpo} material={[MAT.pinCara, MAT.pinLado]} renderOrder={8} />
        <lineSegments geometry={geo.aristas} material={MAT.pinLinea} renderOrder={8} />
      </group>
      <lineSegments ref={hilo} geometry={geo.hilo} material={MAT.pinLinea} />
      <mesh ref={onda} geometry={geo.onda} material={mats.o1} position={[0, TERRAZA, 0]} />
      <mesh ref={onda2} geometry={geo.onda} material={mats.o2} position={[0, TERRAZA, 0]} />
    </group>
  );
}
