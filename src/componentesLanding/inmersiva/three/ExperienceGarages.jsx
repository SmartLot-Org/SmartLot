// Chunk 3D de /para-garages: se carga con lazy() desde paginas/garagesEscena.js y lo monta
// PaginaPlano en las mismas condiciones que el de la home. Es la misma ciudad vista desde
// el otro lado del trato, sobre el escenario común: las escenas compartidas con lo que
// cambia por página y las propias (sedes, alta, búsqueda y llegadas). Sin el pin, la
// jornada, el QR ni la interacción con el mouse de la home. Todo acá es decorativo.
import { CHAT, ROTULOS, SOLICITUD } from '../contenido/garages';
import { CapaChats, ProyectorChats } from './Chats';
import { CapaCotas, ProyectorCotas } from './CotasAlta';
import { Escenario } from './Escenario';
import { Alta } from './escenas/Alta';
import { Busqueda } from './escenas/Busqueda';
import { Ciudad } from './escenas/Ciudad';
import { Clima } from './escenas/Clima';
import { Garage } from './escenas/Garage';
import { Llegadas } from './escenas/Llegadas';
import { Pulsos } from './escenas/Pulsos';
import { Sedes } from './escenas/Sedes';
import { Trafico } from './escenas/Trafico';
import { Trato } from './escenas/Trato';
import { Vueltas } from './escenas/Vueltas';
import { ANCLAS, G1, G2, G3 } from './mundo';
import { Proyector, Rotulos } from './Rotulos';
import { ROTULOS_GARAGES } from './rotulosGarages';
import { CapaSolicitud, ProyectorSolicitud } from './Solicitud';
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

// Capas HTML del dibujo, encima del Canvas y en este orden (las últimas quedan arriba).
const CAPAS = (
  <>
    <Rotulos rotulos={ROTULOS_GARAGES} lente={false} />
    <CapaCotas cotas={ROTULOS.alta} />
    <CapaChats mensajes={CHAT} />
    <CapaSolicitud solicitud={SOLICITUD} />
  </>
);

export default function ExperienceGarages() {
  return (
    <Escenario capas={CAPAS}>
      {/* Geometrías y materiales son del módulo: no se descartan al desmontar una escena. */}
      <group dispose={null}>
        <Ciudad />
        <Clima />
        <Sedes />
        <Trato />
        <Alta />
        <Vueltas />
        <Garage />
        <Trafico />
        <Pulsos focos={FOCOS} />
        <Busqueda />
        <Llegadas />
      </group>
      <Proyector rotulos={ROTULOS_GARAGES} />
      <ProyectorCotas cotas={ROTULOS.alta} />
      <ProyectorChats mensajes={CHAT} ancla={ANCLAS.g1} comparar={SIN_DESLIZADOR} />
      <ProyectorSolicitud solicitud={SOLICITUD} />
    </Escenario>
  );
}
