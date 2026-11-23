// Chunk 3D del cierre de "Para garages": un garage dibujado en líneas, con el
// logo de SmartLot en volumen flotando sobre el techo. Mismo lenguaje que la
// landing inmersiva: caras del color del papel, aristas en tinta y el azul
// solo para la marca. Sin luces. Todo es decorativo.
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  MeshBasicMaterial,
  RingGeometry,
} from "three";
import { geometriaLogo } from "../logo3d/geometriaLogo";

// Medidas en "altos de logo".
const GARAGE = { ancho: 2.3, fondo: 1.5, alto: 0.62 };
const TECHO = GARAGE.alto + 0.06;
const PORTON = { ancho: 1.2, alto: 0.46, tablas: 6 };
const LOGO = { alto: 1.55, flota: 0.6 };
const PLAZAS = 4;

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Los tokens de color llegan como variables CSS del contenedor. Algunos
// navegadores devuelven formatos que three no lee (oklch, color()): se pasan por
// un canvas de 1 px y se lee el pixel.
function leerColores(nodo) {
  const estilo = getComputedStyle(nodo);
  const lienzo = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const color = (nombre) => {
    lienzo.clearRect(0, 0, 1, 1);
    lienzo.fillStyle = estilo.getPropertyValue(nombre).trim() || "black";
    lienzo.fillRect(0, 0, 1, 1);
    const [r, g, b] = lienzo.getImageData(0, 0, 1, 1).data;
    return new Color(`rgb(${r}, ${g}, ${b})`);
  };
  return {
    cara: color("--logo-cara"),
    lado: color("--logo-lado"),
    tinta: color("--logo-tinta"),
    papel: color("--logo-papel"),
    cielo: color("--logo-cielo"),
  };
}

function segmentos(lista) {
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(lista, 3));
  return g;
}

function construir() {
  const { ancho, fondo, alto } = GARAGE;
  const cuerpo = new BoxGeometry(ancho, alto, fondo).translate(0, alto / 2, 0);
  const techo = new BoxGeometry(ancho + 0.12, 0.06, fondo + 0.12).translate(0, alto + 0.03, 0);

  // Portón al frente (+Z) con sus tablas, y el cartel de la entrada.
  const z = fondo / 2 + 0.002;
  const x0 = -PORTON.ancho / 2;
  const x1 = PORTON.ancho / 2;
  const porton = [x0, 0, z, x0, PORTON.alto, z, x0, PORTON.alto, z, x1, PORTON.alto, z, x1, PORTON.alto, z, x1, 0, z];
  for (let i = 1; i < PORTON.tablas; i++) {
    const y = (PORTON.alto * i) / PORTON.tablas;
    porton.push(x0, y, z, x1, y, z);
  }

  // Plazas pintadas delante del portón y la senda de entrada.
  const plazas = [];
  const largo = 0.75;
  const paso = 0.5;
  const desde = -((PLAZAS - 1) * paso) / 2 - paso / 2;
  for (let i = 0; i <= PLAZAS; i++) {
    const x = desde + i * paso;
    plazas.push(x, 0.002, fondo / 2 + 0.55, x, 0.002, fondo / 2 + 0.55 + largo);
  }
  plazas.push(desde, 0.002, fondo / 2 + 0.55, desde + PLAZAS * paso, 0.002, fondo / 2 + 0.55);

  // Vereda: un contorno amplio que asienta el garage sin dibujar un piso lleno.
  const v = { x: ancho / 2 + 0.5, z0: -fondo / 2 - 0.4, z1: fondo / 2 + 1.55 };
  const vereda = [-v.x, 0, v.z0, v.x, 0, v.z0, v.x, 0, v.z0, v.x, 0, v.z1, v.x, 0, v.z1, -v.x, 0, v.z1, -v.x, 0, v.z1, -v.x, 0, v.z0];

  const logo = geometriaLogo({ profundidad: 0.09, detalle: 1.5 });
  return {
    cuerpo,
    cuerpoAristas: new EdgesGeometry(cuerpo),
    techo,
    techoAristas: new EdgesGeometry(techo),
    porton: segmentos(porton),
    plazas: segmentos(plazas),
    vereda: segmentos(vereda),
    logo,
    logoAristas: new EdgesGeometry(logo, 25),
    hilo: segmentos([0, 0, 0, 0, -1, 0]),
    onda: new RingGeometry(0.9, 1, 64).rotateX(-Math.PI / 2),
  };
}

function crearMateriales(c) {
  const cara = (color, extra) =>
    new MeshBasicMaterial({ color, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, ...extra });
  return {
    papel: cara(c.papel),
    // Techo celeste opaco (mezcla de papel y cielo): sin transparencias que dejen ver aristas internas.
    techo: cara(c.papel.clone().lerp(c.cielo, 0.55)),
    tinta: new LineBasicMaterial({ color: c.tinta, transparent: true, opacity: 0.85 }),
    tenue: new LineBasicMaterial({ color: c.tinta, transparent: true, opacity: 0.3 }),
    logoCara: cara(c.cara),
    logoLado: cara(c.lado),
    logoLinea: new LineBasicMaterial({ color: c.tinta }),
    onda1: new MeshBasicMaterial({ color: c.cara, transparent: true, depthWrite: false }),
    onda2: new MeshBasicMaterial({ color: c.cara, transparent: true, depthWrite: false }),
  };
}

function Escena({ reducido }) {
  // El lienzo hereda las variables CSS del contenedor (GarageLogo.jsx).
  const lienzo = useThree((s) => s.gl.domElement);
  const colores = useMemo(() => leerColores(lienzo), [lienzo]);
  const geo = useMemo(() => construir(), []);
  const mat = useMemo(() => crearMateriales(colores), [colores]);
  const logo = useRef(null);
  const hilo = useRef(null);
  const onda1 = useRef(null);
  const onda2 = useRef(null);
  const mira = useRef({ x: 0, y: 0 });
  const llegada = useRef(null);

  useEffect(() => () => {
    Object.values(geo).forEach((g) => g.dispose());
    Object.values(mat).forEach((m) => m.dispose());
  }, [geo, mat]);

  useFrame((estado, dt) => {
    const tiempo = reducido ? 0 : estado.clock.elapsedTime;
    llegada.current ??= tiempo;
    // Entra subiendo desde el techo; con movimiento reducido ya está en su lugar.
    const t = reducido ? 1 : limitar((tiempo - llegada.current) / 1.4);
    const sube = 1 - (1 - t) ** 3;

    // El cursor inclina el logo apenas, amortiguado.
    const k = 1 - Math.exp(-dt * 4);
    mira.current.x += ((reducido ? 0 : estado.pointer.x) - mira.current.x) * k;
    mira.current.y += ((reducido ? 0 : estado.pointer.y) - mira.current.y) * k;

    const flota = Math.sin(tiempo * 1.3) * 0.035;
    const pie = TECHO + LOGO.flota * sube + flota;
    logo.current.position.y = pie + (LOGO.alto * sube) / 2;
    logo.current.scale.setScalar(Math.max(0.001, LOGO.alto * sube));
    logo.current.rotation.set(
      -mira.current.y * 0.12,
      Math.PI / 4 + Math.sin(tiempo * 0.5) * 0.45 + mira.current.x * 0.4 + (1 - sube) * 1.4,
      0,
    );

    hilo.current.position.y = pie;
    hilo.current.scale.y = Math.max(0.001, pie - TECHO);
    hilo.current.visible = t > 0.9;

    for (const [ref, m, fase0] of [[onda1, mat.onda1, 0], [onda2, mat.onda2, 0.5]]) {
      const fase = reducido ? 0.35 + fase0 * 0.4 : (tiempo / 2.4 + fase0) % 1;
      m.opacity = sube * 0.55 * (1 - fase) ** 2;
      ref.current.scale.setScalar(0.18 + fase * 0.75);
    }
  });

  return (
    <group position={[0, -1.3, 0]}>
      <lineSegments geometry={geo.vereda} material={mat.tenue} />
      <lineSegments geometry={geo.plazas} material={mat.tenue} />
      <mesh geometry={geo.cuerpo} material={mat.papel} />
      <lineSegments geometry={geo.cuerpoAristas} material={mat.tinta} />
      <mesh geometry={geo.techo} material={mat.techo} />
      <lineSegments geometry={geo.techoAristas} material={mat.tinta} />
      <lineSegments geometry={geo.porton} material={mat.tinta} />
      <mesh ref={onda1} geometry={geo.onda} material={mat.onda1} position={[0, TECHO + 0.002, 0]} />
      <mesh ref={onda2} geometry={geo.onda} material={mat.onda2} position={[0, TECHO + 0.002, 0]} />
      <lineSegments ref={hilo} geometry={geo.hilo} material={mat.tenue} />
      <group ref={logo}>
        <mesh geometry={geo.logo} material={[mat.logoCara, mat.logoLado]} renderOrder={2} />
        <lineSegments geometry={geo.logoAristas} material={mat.logoLinea} renderOrder={2} />
      </group>
    </group>
  );
}

// Encuadre ortográfico que se adapta al tamaño del lienzo (se recalcula solo si cambia).
function Encuadre() {
  const ultimo = useRef("");
  useFrame(({ camera, size }) => {
    const clave = `${size.width}x${size.height}`;
    if (clave === ultimo.current) return;
    ultimo.current = clave;
    camera.zoom = Math.min(size.width / 4.2, size.height / 3.8);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, -1);
  return null;
}

export default function GarageLogoEscena({ activo }) {
  const reducido = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  return (
    <Canvas
      className="!absolute inset-0"
      orthographic
      flat
      dpr={[1, 2]}
      // Fuera de pantalla no dibuja; con movimiento reducido, un solo cuadro.
      frameloop={activo && !reducido ? "always" : "demand"}
      camera={{ position: [10, 8.2, 10], near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Encuadre />
      <Escena reducido={reducido} />
    </Canvas>
  );
}
