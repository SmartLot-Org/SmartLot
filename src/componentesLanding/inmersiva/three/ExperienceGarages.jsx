// Chunk 3D de /para-garages: se carga con lazy() desde paginas/garagesEscena.js y lo monta
// PaginaPlano en las mismas condiciones que el de la home. Es la misma ciudad vista desde
// el otro lado del trato, sobre el escenario común: las escenas compartidas con lo que
// cambia por página y las propias (sedes, búsqueda, la ficha del mapa y llegadas) y el logo del cierre. Sin el pin, la
// jornada, el QR ni la interacción con el mouse de la home. Todo acá es decorativo.
import { BUSQUEDA, CHAT, SOLICITUD } from '../contenido/garages';
import { CapaChats, ProyectorChats } from './Chats';
import { Escenario } from './Escenario';
import { Busqueda } from './escenas/Busqueda';
import { Ciudad } from './escenas/Ciudad';
import { Clima } from './escenas/Clima';
import { Garage } from './escenas/Garage';
import { Llegadas } from './escenas/Llegadas';
import { Logo } from './escenas/Logo';
import { Pulsos } from './escenas/Pulsos';
import { Sedes } from './escenas/Sedes';
import { Trafico } from './escenas/Trafico';
import { Trato } from './escenas/Trato';
import { Vueltas } from './escenas/Vueltas';
import { CapaFichaMapa, ProyectorFichaMapa } from './FichaMapa';
import { ANCLAS, G1, G2, G3 } from './mundo';
import { Proyector, Rotulos } from './Rotulos';
import { ROTULOS_GARAGES } from './rotulosGarages';
import { CapaSolicitud, ProyectorSolicitud } from './Solicitud';
import { vivo } from './vivo';
import './garages.css';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const centro = (g) => [(g.x0 + g.x1) / 2, (g.z0 + g.z1) / 2];
const sinPlanta = (fx) => 1 - limitar(fx.tapa * 2);

// Ondas azules desde los garages con lugar: los dos del mapa y el tuyo mientras está en él.
const FOCOS = [
  { c: centro(G1), peso: (fx) => (1 - fx.fuera) * sinPlanta(fx) },
  { c: centro(G2), peso: sinPlanta },
  { c: centro(G3), peso: sinPlanta },
];
// El chat es del lado del garage y en esta página no hay deslizador.
const SIN_DESLIZADOR = () => 0;
// Rodea a tu garage sin taparlo: arriba a la derecha en horizontal (la nota va a la
// izquierda) y debajo en vertical (la nota va abajo). El ancla es el techo de tu garage;
// su esquina de abajo queda unas 4,2 unidades más abajo en la pantalla, y debajo va el rótulo.
const BAJO_TU_GARAGE = 4.2;
function rodeaTuGarage(px, py, caja, size, horizontal) {
  if (horizontal) return [Math.max(size.width * 0.5, Math.min(px + 24, size.width - caja.width - 72)), Math.max(76, py - caja.height - 40)];
  return [Math.max(8, (size.width - caja.width) / 2), Math.min(py + BAJO_TU_GARAGE * vivo.pxPorUnidad + 48, size.height - caja.height - 16)];
}

// En el cierre el logo flota sobre tu garage, como en la home sobre la oficina: las
// rutas de las sedes convergen ahí. Tu garage es bajo y lleva encima el cartel E, así que
// el logo sube más para que el hilo asome sobre el cartel; y como la cámara de este cierre
// abre más que la de la home (sobre todo en vertical), es un poco más grande.
const SOBRE_TU_GARAGE = [centro(G1)[0], G1.h + 0.03, centro(G1)[1]];
const LOGO_TAMANO = 13;
const LOGO_AIRE = 9.5;

// Capas HTML del dibujo, encima del Canvas y en este orden (las últimas quedan arriba).
const CAPAS = (
  <>
    <Rotulos rotulos={ROTULOS_GARAGES} lente={false} />
    <CapaFichaMapa busqueda={BUSQUEDA} seccion="mapa" />
    <CapaChats mensajes={CHAT} />
    <CapaSolicitud solicitud={SOLICITUD} />
  </>
);

export default function ExperienceGarages() {
  return (
    <Escenario capas={CAPAS} conIntro={false}>
      {/* Geometrías y materiales son del módulo: no se descartan al desmontar una escena. */}
      <group dispose={null}>
        <Ciudad />
        <Clima />
        <Sedes />
        <Trato />
        <Vueltas />
        <Garage />
        <Trafico />
        <Pulsos focos={FOCOS} />
        <Busqueda />
        <Llegadas />
        <Logo base={SOBRE_TU_GARAGE} tamano={LOGO_TAMANO} aire={LOGO_AIRE} />
      </group>
      <Proyector rotulos={ROTULOS_GARAGES} />
      <ProyectorFichaMapa />
      <ProyectorChats mensajes={CHAT} ancla={ANCLAS.g1} comparar={SIN_DESLIZADOR} colocar={rodeaTuGarage} />
      <ProyectorSolicitud solicitud={SOLICITUD} />
    </Escenario>
  );
}
