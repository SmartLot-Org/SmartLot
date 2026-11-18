// Chunk 3D de la home: se carga con lazy() desde Landing, que no lo monta con tier
// 'static', con ?sin3d ni antes de inicializar. Es la composición de la home sobre el
// escenario común (Escenario.jsx). Todo acá es decorativo.
import { Acceso } from './escenas/Acceso';
import { Ciudad } from './escenas/Ciudad';
import { Clima } from './escenas/Clima';
import { Estaciona } from './escenas/Estaciona';
import { Garage } from './escenas/Garage';
import { Jornada } from './escenas/Jornada';
import { Noche } from './escenas/Noche';
import { Onda } from './escenas/Onda';
import { Pin } from './escenas/Pin';
import { Pulsos } from './escenas/Pulsos';
import { Red } from './escenas/Red';
import { Realce } from './escenas/Realce';
import { Trafico } from './escenas/Trafico';
import { Trato } from './escenas/Trato';
import { Vueltas } from './escenas/Vueltas';
import { CapaCelular, ProyectorCelular } from './Celular';
import { CapaEleccion, Eleccion, ProyectorEleccion } from './Eleccion';
import { CapaChats, ProyectorChats } from './Chats';
import { Escenario } from './Escenario';
import { CapaInteraccion, ProyectorInteraccion } from './Interaccion';
import { CapaReloj, ProyectorReloj } from './Reloj';
import { Proyector, Rotulos } from './Rotulos';

// Capas HTML del dibujo, encima del Canvas y en este orden (las últimas quedan arriba).
const CAPAS = (
  <>
    <Rotulos />
    <CapaInteraccion />
    <CapaCelular />
    <CapaChats />
    <CapaReloj />
    <CapaEleccion />
  </>
);

export default function Experience() {
  return (
    <Escenario capas={CAPAS}>
      {/* Geometrías y materiales son del módulo: no se descartan al desmontar una escena. */}
      <group dispose={null}>
        <Ciudad />
        <Clima />
        <Trato />
        <Vueltas />
        <Garage />
        <Estaciona />
        <Acceso />
        <Trafico />
        <Noche />
        <Pulsos />
        <Red />
        <Jornada />
        <Onda />
        <Eleccion />
        <Realce />
        <Pin />
      </group>
      <Proyector />
      <ProyectorInteraccion />
      <ProyectorCelular />
      <ProyectorChats />
      <ProyectorReloj />
      <ProyectorEleccion />
    </Escenario>
  );
}
