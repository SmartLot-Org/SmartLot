// Colores de la escena: salen de los mismos tokens CSS que usa la capa DOM
// (.plano en inmersiva.css), así el dibujo sigue al tema sin duplicar valores.
import { Color, DoubleSide, LineBasicMaterial, LineDashedMaterial, MeshBasicMaterial } from 'three';

const cara = (extra) => new MeshBasicMaterial({ side: DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, ...extra });
const relleno = (extra) => new MeshBasicMaterial({ side: DoubleSide, ...extra });
const linea = (extra) => new LineBasicMaterial(extra);

// Un solo lenguaje de materiales: caras del color del papel (tapan lo que está
// detrás, como en un dibujo de líneas ocultas) y aristas en tinta. Sin luces.
export const MAT = {
  papel: cara(),
  papelTrato: cara({ transparent: true }),
  papelAcceso: cara({ transparent: true }),
  contexto: linea(),
  tenue: linea(),
  lejos: linea({ transparent: true, opacity: 0 }),
  tinta: linea({ transparent: true }),
  tintaAcceso: linea({ transparent: true }),
  senalLinea: linea({ transparent: true }),
  tratoLinea: linea({ transparent: true }),
  sumadosLinea: linea(),
  techoTrato: relleno({ transparent: true, opacity: 0 }),
  techoOtros: relleno({ transparent: true, opacity: 0 }),
  ruta: relleno({ depthTest: false, transparent: true }),
  plantaLinea: linea({ transparent: true, opacity: 0 }),
  plantaTenue: linea({ transparent: true, opacity: 0 }),
  plazas: relleno(),
  vueltaLinea: new LineDashedMaterial({ dashSize: 0.32, gapSize: 0.22, transparent: true, opacity: 0 }),
  papelVuelta: cara({ transparent: true }),
  tintaVuelta: linea({ transparent: true }),
  losaLado: cara(),
  losaTapa: relleno({ polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
  losaLinea: linea(),
};

const tono = { media: new Color(), senal: new Color() };

export function colorear(raiz) {
  const estilo = getComputedStyle(raiz);
  const token = (nombre) => estilo.getPropertyValue(nombre).trim();
  const papel = token('--papel');
  const tinta = token('--tinta');
  const senal = token('--senal');
  const media = token('--tinta-media');
  const tenue = token('--tinta-tenue');
  for (const m of [MAT.papel, MAT.papelTrato, MAT.papelAcceso, MAT.papelVuelta, MAT.losaLado]) m.color.set(papel);
  for (const m of [MAT.tinta, MAT.tintaAcceso, MAT.plantaLinea, MAT.tintaVuelta, MAT.losaLinea]) m.color.set(tinta);
  for (const m of [MAT.contexto, MAT.plantaTenue, MAT.vueltaLinea]) m.color.set(media);
  for (const m of [MAT.tenue, MAT.lejos]) m.color.set(tenue);
  for (const m of [MAT.senalLinea, MAT.tratoLinea, MAT.techoTrato, MAT.techoOtros, MAT.ruta, MAT.plazas, MAT.losaTapa]) m.color.set(senal);
  tono.media.set(media);
  tono.senal.set(senal);
  MAT.sumadosLinea.color.copy(tono.media);
}

// Los garages que se suman pasan de tinta media a azul señal.
export function tenirSumados(t) {
  MAT.sumadosLinea.color.copy(tono.media).lerp(tono.senal, t);
}
