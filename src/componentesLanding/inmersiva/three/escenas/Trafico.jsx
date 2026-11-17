import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BufferAttribute, BufferGeometry } from 'three';
import { geometria } from '../geometria';
import { atardecer, horaDe } from '../jornada';
import { CALLES, LIMITE_CIUDAD, MUNDO } from '../mundo';
import { MAT } from '../paleta';
import { vivo } from '../vivo';

// Tráfico ambiental: autos que cruzan la ciudad por algunas calles, en tinta
// media para no competir con el relato. Se van al entrar al garage y se
// quedan quietos con movimiento reducido (vivo.tiempo no avanza).
const POR_CALLE = 3;
const CARRIL = 0.32;           // media calle: cada sentido por su mano
const BORDE = 10;              // unidades en las que el auto aparece y se va
const AUTOS = CALLES.flatMap((calle, c) => Array.from({ length: POR_CALLE }, (_, k) => ({
  ...calle,
  fase: (k / POR_CALLE + c * 0.137) % 1,
  velocidad: 2.4 + ((c * 7 + k * 3) % 5) * 0.35,
})));

// Haz de los faros, en el suelo delante del auto (frente en +X): se ve de noche.
const FARO = new BufferGeometry();
FARO.setAttribute('position', new BufferAttribute(new Float32Array([
  0.21, 0.04, -0.06, 0.95, 0.04, -0.26, 0.95, 0.04, 0.26,
  0.21, 0.04, -0.06, 0.95, 0.04, 0.26, 0.21, 0.04, 0.06,
]), 3));

export function Trafico() {
  const geo = useMemo(() => ({ caras: geometria(MUNDO.coche.caras), aristas: geometria(MUNDO.coche.aristas) }), []);
  const grupo = useRef(null);
  const autos = useRef([]);
  const largo = LIMITE_CIUDAD * 2;

  useFrame(() => {
    const presencia = vivo.aparecen * (1 - Math.min(1, vivo.fx.tapa * 2)) * (1 - vivo.fx.acceso);
    grupo.current.visible = presencia > 0.01;
    if (!grupo.current.visible) return;
    MAT.papelTrafico.opacity = presencia;
    MAT.tintaTrafico.opacity = presencia;
    MAT.faro.opacity = presencia * atardecer(horaDe(vivo.fx.hora)) * 0.4;
    AUTOS.forEach((a, i) => {
      const auto = autos.current[i];
      const d = (a.fase * largo + vivo.tiempo * a.velocidad) % largo;
      const t = a.sentido * (-LIMITE_CIUDAD + d);
      const carril = a.en + CARRIL * a.sentido;
      if (a.eje === 'x') {
        // Calle paralela a Z: x fijo, avanza en z.
        auto.position.set(carril, 0.03, t);
        auto.rotation.y = a.sentido > 0 ? -Math.PI / 2 : Math.PI / 2;
      } else {
        // Calle paralela a X: z fijo, avanza en x.
        auto.position.set(t, 0.03, carril);
        auto.rotation.y = a.sentido > 0 ? 0 : Math.PI;
      }
      const entra = Math.min(1, d / BORDE, (largo - d) / BORDE);
      auto.scale.setScalar(1.9 * Math.max(0.001, entra));
    });
  });

  return (
    <group ref={grupo} visible={false}>
      {AUTOS.map((_, i) => (
        <group key={i} ref={(el) => { autos.current[i] = el; }}>
          <mesh geometry={geo.caras} material={MAT.papelTrafico} />
          <lineSegments geometry={geo.aristas} material={MAT.tintaTrafico} />
          <mesh geometry={FARO} material={MAT.faro} />
        </group>
      ))}
    </group>
  );
}
