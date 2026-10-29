import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  MathUtils,
  Object3D,
  Path,
  Shape,
  TubeGeometry,
  Vector3,
} from 'three';
import { encuadreEn, posicionPaso, suavizar } from '../../../helpers/recorridoLanding';
import { ENCUADRES, ENCUADRES_VERTICAL } from './camaras';
import { PALETA } from './paleta';
import { rigRecorrido } from './rigRecorrido';

// Único módulo que importa three: llega por lazy() desde EscenarioRecorrido,
// así three.js queda en su propio chunk y fuera del bundle principal.

const TOTAL_PASOS = ENCUADRES.length;
const posicionActual = () => posicionPaso(rigRecorrido.progreso, TOTAL_PASOS);

// Unidades de maqueta: losa de 30 × 20 centrada en el origen, ingreso sobre
// x = -15. Las plazas del trato son las cinco del fondo a la derecha.
const PLAZAS_TRATO_X = [1.25, 3.75, 6.25, 8.75, 11.25];
const FILA_TRATO_Z = -6.25;
const COLUMNAS = [
  [-12.5, -3.5], [0, -3.5], [12.5, -3.5],
  [-12.5, 3.5], [0, 3.5], [12.5, 3.5],
];
// Desde afuera hasta la plaza reservada: espera en el ingreso, pasa la
// barrera, entra y estaciona de frente.
const PUNTOS_TRAYECTO = [
  [-27, 0, 0], [-17.5, 0, 0], [-13.3, 0, 0], [-9.5, 0, 0],
  [-3, 0, 0], [0.2, 0, -1.4], [1.1, 0, -3.6], [1.25, 0, -6],
];
const SEGMENTOS_RASTRO = 120;
const LADOS_RASTRO = 6;

// Amortiguado independiente del framerate; se aplica una sola vez (el scroll
// ya llega suavizado por Lenis y el ScrollTrigger no agrega scrub).
const LAMBDA_CAMARA = 4;
function amortiguar(vector, destino, delta) {
  vector.x = MathUtils.damp(vector.x, destino.x, LAMBDA_CAMARA, delta);
  vector.y = MathUtils.damp(vector.y, destino.y, LAMBDA_CAMARA, delta);
  vector.z = MathUtils.damp(vector.z, destino.z, LAMBDA_CAMARA, delta);
}

// Valores de trabajo de la cámara: se recalculan en cada frame y no guardan
// estado entre frames, así que alcanza con una sola copia por módulo.
const encuadre = { posicion: [0, 0, 0], objetivo: [0, 0, 0] };
const destinoPosicion = new Vector3();
const destinoObjetivo = new Vector3();

function CamaraRecorrido() {
  // Punto que mira la cámara, amortiguado entre frames (null hasta ubicarla).
  const objetivo = useRef(null);

  useFrame(({ camera, size }, delta) => {
    // En vertical el panel ocupa la parte baja: más campo visual para que la
    // maqueta entre arriba sin alejarse demasiado.
    const vertical = size.height > size.width;
    const fov = vertical ? 50 : 35;
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    encuadreEn(posicionActual(), vertical ? ENCUADRES_VERTICAL : ENCUADRES, encuadre);
    destinoPosicion.fromArray(encuadre.posicion);
    destinoObjetivo.fromArray(encuadre.objetivo);
    // Mientras la sección entra, la cámara baja desde más alto.
    destinoPosicion.y += (1 - rigRecorrido.entrada) * 10;

    if (!objetivo.current) {
      camera.position.copy(destinoPosicion);
      objetivo.current = destinoObjetivo.clone();
    } else {
      amortiguar(camera.position, destinoPosicion, delta);
      amortiguar(objetivo.current, destinoObjetivo, delta);
    }
    camera.lookAt(objetivo.current);
  });

  return null;
}

// Sombra horneada: un rectángulo difuso dibujado una vez en un canvas 2D.
// Se dibuja fuera del lienzo y se deja solo la sombra (shadowOffset) porque
// shadowBlur funciona en todos los navegadores, a diferencia de ctx.filter.
function useTexturaSombra() {
  const textura = useMemo(() => {
    const lienzo = document.createElement('canvas');
    lienzo.width = 256;
    lienzo.height = 192;
    const ctx = lienzo.getContext('2d');
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 1000;
    ctx.fillRect(40 - 1000, 40, 176, 112);
    return new CanvasTexture(lienzo);
  }, []);
  useEffect(() => () => textura.dispose(), [textura]);
  return textura;
}

function Losa({ sombra }) {
  return (
    <group>
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[30, 0.6, 20]} />
        <meshLambertMaterial color={PALETA['brand-surface']} />
      </mesh>
      {/* Calle de acceso: el vehículo llega por acá antes de la barrera. */}
      <mesh position={[-23, -0.2, 0]}>
        <boxGeometry args={[16, 0.36, 5]} />
        <meshLambertMaterial color={PALETA.border} />
      </mesh>
      <mesh position={[1.5, -0.62, 1.5]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[44, 34]} />
        <meshBasicMaterial map={sombra} color={PALETA['brand-deep']} transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  );
}

// Muros del fondo y de la izquierda (con el hueco del ingreso) y columnas
// cortadas a media altura, como en una maqueta.
function Estructura() {
  const blanco = PALETA['brand-surface'];
  return (
    <group>
      <mesh position={[0, 0.5, -9.85]}>
        <boxGeometry args={[30, 1, 0.3]} />
        <meshLambertMaterial color={blanco} />
      </mesh>
      <mesh position={[-14.85, 0.5, -6]}>
        <boxGeometry args={[0.3, 1, 8]} />
        <meshLambertMaterial color={blanco} />
      </mesh>
      <mesh position={[-14.85, 0.5, 6]}>
        <boxGeometry args={[0.3, 1, 8]} />
        <meshLambertMaterial color={blanco} />
      </mesh>
      {COLUMNAS.map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, 0.8, z]}>
          <boxGeometry args={[0.6, 1.6, 0.6]} />
          <meshLambertMaterial color={blanco} />
        </mesh>
      ))}
    </group>
  );
}

// Más de 20 piezas iguales: van instanciadas.
function Demarcacion() {
  const separadores = useRef(null);
  const guiones = useRef(null);

  useLayoutEffect(() => {
    const pieza = new Object3D();
    let k = 0;
    for (const z of [FILA_TRATO_Z, -FILA_TRATO_Z]) {
      for (let i = 0; i <= 10; i++) {
        pieza.position.set(-12.5 + 2.5 * i, 0.025, z);
        pieza.updateMatrix();
        separadores.current.setMatrixAt(k++, pieza.matrix);
      }
    }
    separadores.current.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < 11; i++) {
      pieza.position.set(-11 + 2.2 * i, 0.025, 0);
      pieza.updateMatrix();
      guiones.current.setMatrixAt(i, pieza.matrix);
    }
    guiones.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group>
      <instancedMesh ref={separadores} args={[undefined, undefined, 22]} frustumCulled={false}>
        <boxGeometry args={[0.09, 0.01, 5.5]} />
        <meshBasicMaterial color={PALETA['text-muted']} />
      </instancedMesh>
      <instancedMesh ref={guiones} args={[undefined, undefined, 11]} frustumCulled={false}>
        <boxGeometry args={[1.2, 0.01, 0.12]} />
        <meshBasicMaterial color={PALETA['border-strong']} />
      </instancedMesh>
    </group>
  );
}

// Solicitadas (celeste) que pasan a trato activo (azul) una por una; la
// primera queda marcada como reservada en el paso de la reserva.
function PlazasTrato() {
  const plazas = useRef([]);
  const marco = useRef(null);
  const cielo = useMemo(() => new Color(PALETA['brand-sky']), []);
  const azul = useMemo(() => new Color(PALETA['brand-blue']), []);
  const formaMarco = useMemo(() => {
    const exterior = new Shape();
    exterior.moveTo(-1.1, -2.6);
    exterior.lineTo(1.1, -2.6);
    exterior.lineTo(1.1, 2.6);
    exterior.lineTo(-1.1, 2.6);
    exterior.closePath();
    const hueco = new Path();
    hueco.moveTo(-0.78, -2.28);
    hueco.lineTo(-0.78, 2.28);
    hueco.lineTo(0.78, 2.28);
    hueco.lineTo(0.78, -2.28);
    hueco.closePath();
    exterior.holes.push(hueco);
    return exterior;
  }, []);

  useFrame(() => {
    const t = posicionActual();
    const entrada = rigRecorrido.entrada;
    plazas.current.forEach((malla, i) => {
      if (!malla) return;
      const demarcada = suavizar(0.2 + 0.1 * i, 0.6 + 0.1 * i, entrada);
      malla.visible = demarcada > 0.001;
      malla.scale.y = Math.max(demarcada, 0.001);
      const trato = suavizar(0.15 + 0.12 * i, 0.45 + 0.12 * i, t);
      malla.material.color.copy(cielo).lerp(azul, trato);
    });
    if (marco.current) {
      const reservada = suavizar(1.1, 1.5, t);
      marco.current.visible = reservada > 0.001;
      marco.current.material.opacity = reservada;
    }
  });

  return (
    <group>
      {PLAZAS_TRATO_X.map((x, i) => (
        <mesh
          key={x}
          ref={(malla) => {
            plazas.current[i] = malla;
          }}
          position={[x, 0.02, FILA_TRATO_Z]}
          rotation-x={-Math.PI / 2}
        >
          <planeGeometry args={[2.2, 5.2]} />
          <meshBasicMaterial color={PALETA['brand-sky']} />
        </mesh>
      ))}
      <mesh ref={marco} position={[PLAZAS_TRATO_X[0], 0.035, FILA_TRATO_Z]} rotation-x={-Math.PI / 2}>
        <shapeGeometry args={[formaMarco]} />
        <meshBasicMaterial color={PALETA['brand-surface']} transparent opacity={0} />
      </mesh>
    </group>
  );
}

function Barrera() {
  const brazo = useRef(null);
  const luz = useRef(null);
  const apagada = useMemo(() => new Color(PALETA['border-strong']), []);
  const habilitada = useMemo(() => new Color(PALETA.success), []);

  useFrame(() => {
    const t = posicionActual();
    // Todo pasa en el viaje entre pasos: en la estadía de "reserva" la
    // barrera sigue cerrada y en la de "acceso" ya está abierta y en verde.
    const abierta = suavizar(2.2, 2.45, t) * (1 - suavizar(3.3, 3.6, t));
    brazo.current.rotation.x = -abierta * 1.35;
    const encendida = suavizar(2.1, 2.25, t) * (1 - suavizar(3.35, 3.45, t));
    luz.current.material.color.copy(apagada).lerp(habilitada, encendida);
  });

  // Del lado del fondo del carril: del lado del frente la tapaba una columna
  // en la cámara del acceso.
  return (
    <group position={[-13.3, 0, -2.5]}>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.4, 1.1, 0.4]} />
        <meshLambertMaterial color={PALETA['brand-surface']} />
      </mesh>
      {/* Tapa luminosa apenas más ancha que el poste: se ve desde cualquier
          encuadre, también desde la cámara baja del acceso. */}
      <mesh ref={luz} position={[0, 1.19, 0]}>
        <boxGeometry args={[0.48, 0.18, 0.48]} />
        <meshBasicMaterial color={PALETA['border-strong']} />
      </mesh>
      <group ref={brazo} position={[0, 0.95, 0.15]}>
        <mesh position={[0, 0, 2.2]}>
          <boxGeometry args={[0.12, 0.12, 4.3]} />
          <meshLambertMaterial color={PALETA['brand-deep']} />
        </mesh>
      </group>
    </group>
  );
}

function useTrayecto() {
  return useMemo(() => {
    const curva = new CatmullRomCurve3(
      PUNTOS_TRAYECTO.map((p) => new Vector3(...p)),
      false,
      'centripetal',
    );
    const porTramo = 100;
    const largos = curva.getLengths((PUNTOS_TRAYECTO.length - 1) * porTramo);
    const total = largos[largos.length - 1];
    const uEnPunto = (indice) => largos[indice * porTramo] / total;
    return { curva, uEspera: uEnPunto(1), uBarrera: uEnPunto(2), uAdentro: uEnPunto(3) };
  }, []);
}

// Avance del vehículo sobre el trayecto (0..1) según la posición del
// recorrido; -1 = todavía no aparece. Es función pura de t: el scroll hacia
// atrás deshace todo sin estados intermedios.
function avanceVehiculo(t, { uEspera, uAdentro }) {
  if (t < 1.2) return -1;
  if (t < 2.2) return uEspera * suavizar(1.2, 1.9, t);
  if (t < 3.1) return uEspera + (uAdentro - uEspera) * suavizar(2.4, 2.95, t);
  return uAdentro + (1 - uAdentro) * suavizar(3.1, 3.85, t);
}

const tangente = new Vector3();

function Vehiculo({ trayecto, sombra }) {
  const vehiculo = useRef(null);

  useFrame(() => {
    const u = avanceVehiculo(posicionActual(), trayecto);
    const grupo = vehiculo.current;
    grupo.visible = u >= 0;
    if (u < 0) return;
    trayecto.curva.getPointAt(u, grupo.position);
    trayecto.curva.getTangentAt(u, tangente);
    grupo.rotation.y = Math.atan2(tangente.x, tangente.z);
  });

  return (
    <group ref={vehiculo} visible={false}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.8, 0.7, 4.2]} />
        <meshLambertMaterial color={PALETA['brand-deep']} />
      </mesh>
      <mesh position={[0, 1.08, -0.3]}>
        <boxGeometry args={[1.5, 0.5, 2.1]} />
        <meshLambertMaterial color={PALETA['brand-warm']} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[2.6, 5]} />
        <meshBasicMaterial map={sombra} color={PALETA['brand-deep']} transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  );
}

// El recorrido registrado: se dibuja detrás del vehículo desde la barrera.
function Rastro({ trayecto }) {
  const malla = useRef(null);
  const geometria = useMemo(() => {
    const puntos = [];
    for (let i = 0; i <= 60; i++) {
      const u = trayecto.uBarrera + ((1 - trayecto.uBarrera) * i) / 60;
      puntos.push(trayecto.curva.getPointAt(u).setY(0.09));
    }
    return new TubeGeometry(new CatmullRomCurve3(puntos), SEGMENTOS_RASTRO, 0.07, LADOS_RASTRO, false);
  }, [trayecto]);
  useEffect(() => () => geometria.dispose(), [geometria]);

  useFrame(() => {
    const u = avanceVehiculo(posicionActual(), trayecto);
    const fraccion = Math.max(0, (u - trayecto.uBarrera) / (1 - trayecto.uBarrera));
    const segmentos = Math.floor(fraccion * SEGMENTOS_RASTRO);
    geometria.setDrawRange(0, segmentos * LADOS_RASTRO * 6);
    malla.current.visible = segmentos > 0;
  });

  return (
    <mesh ref={malla} geometry={geometria} visible={false}>
      <meshBasicMaterial color={PALETA['brand-blue']} />
    </mesh>
  );
}

function Maqueta() {
  const sombra = useTexturaSombra();
  const trayecto = useTrayecto();
  return (
    <group>
      <Losa sombra={sombra} />
      <Demarcacion />
      <PlazasTrato />
      <Estructura />
      <Barrera />
      <Rastro trayecto={trayecto} />
      <Vehiculo trayecto={trayecto} sombra={sombra} />
    </group>
  );
}

export default function EscenaGarage({ activa }) {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      frameloop={activa ? 'always' : 'never'}
      camera={{ fov: 35, near: 0.1, far: 200, position: ENCUADRES[0].posicion }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      {/* Luz calibrada para que las caras de la maqueta blanca den los grises
          de DESIGN.md: tapa ≈ surface, frente ≈ border, costado ≈ border-strong. */}
      <hemisphereLight args={[PALETA['brand-surface'], PALETA['border-strong'], 2.4]} />
      <directionalLight position={[-6, 12, 8]} intensity={1} />
      <Maqueta />
      <CamaraRecorrido />
    </Canvas>
  );
}
