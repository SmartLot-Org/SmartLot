// Colores de la escena: salen de los mismos tokens CSS que usa la capa DOM
// (.plano en inmersiva.css), así el dibujo y el texto no duplican valores.
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
  papelEstaciona: cara({ transparent: true, opacity: 0 }),
  tintaEstaciona: linea({ transparent: true, opacity: 0 }),
  papelTrafico: cara({ transparent: true, opacity: 0 }),
  tintaTrafico: linea({ transparent: true, opacity: 0 }),
  pulso: relleno({ transparent: true, depthWrite: false }),
  pinCara: relleno({ polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, transparent: true }),
  pinLado: relleno({ polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, transparent: true }),
  pinLinea: linea({ transparent: true }),
  logoCara: relleno({ polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, transparent: true, opacity: 0 }),
  logoLado: relleno({ polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, transparent: true, opacity: 0 }),
  logoLinea: linea({ transparent: true, opacity: 0 }),
  faro: relleno({ transparent: true, opacity: 0, depthWrite: false }),
  sombra: relleno({ transparent: true, opacity: 0, depthWrite: false }),
  nubeSombra: relleno({ transparent: true, opacity: 0, depthWrite: false }),
  nube: relleno({ transparent: true, opacity: 0, depthWrite: false }),
  nubeLinea: linea({ transparent: true, opacity: 0 }),
  red: relleno({ depthTest: false, transparent: true }),
  luz: relleno({ transparent: true, opacity: 0, depthWrite: false }),
  realce: linea({ transparent: true, opacity: 0, depthTest: false }),
  realceTecho: relleno({ transparent: true, opacity: 0, depthWrite: false }),
  ocupa: relleno({ transparent: true, opacity: 0, depthWrite: false }),
  eleccion: relleno({ transparent: true, opacity: 0, depthWrite: false, depthTest: false }),
  eleccionLinea: linea({ transparent: true, opacity: 0, depthTest: false }),
  onda: relleno({ transparent: true, opacity: 0, depthWrite: false, depthTest: false }),
};

const tono = { media: new Color(), senal: new Color() };

// Durante la transición día / noche el navegador puede devolver colores
// interpolados en formatos que three no lee (oklab, color(srgb …)). Se pasan
// por un canvas de 1 px y se lee el pixel: siempre sale RGB.
let lienzo = null;
function aRgb(valor) {
  if (/^(#|rgb)/.test(valor)) return valor;
  lienzo ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  lienzo.clearRect(0, 0, 1, 1);
  lienzo.fillStyle = valor;
  lienzo.fillRect(0, 0, 1, 1);
  const [r, g, b] = lienzo.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

export function colorear(raiz) {
  const estilo = getComputedStyle(raiz);
  const token = (nombre) => aRgb(estilo.getPropertyValue(nombre).trim());
  const papel = token('--papel');
  const tinta = token('--tinta');
  const senal = token('--senal');
  const media = token('--tinta-media');
  const tenue = token('--tinta-tenue');
  for (const m of [MAT.papel, MAT.papelTrato, MAT.papelAcceso, MAT.papelVuelta, MAT.losaLado, MAT.papelTrafico, MAT.papelEstaciona]) m.color.set(papel);
  for (const m of [MAT.tinta, MAT.tintaAcceso, MAT.plantaLinea, MAT.tintaVuelta, MAT.losaLinea, MAT.pinLinea, MAT.logoLinea, MAT.tintaEstaciona]) m.color.set(tinta);
  MAT.tintaTrafico.color.set(media);
  MAT.sombra.color.set(tinta);
  MAT.nubeSombra.color.set(tinta);
  MAT.nube.color.set(papel);
  MAT.nubeLinea.color.set(media);
  MAT.pinLado.color.set(token('--senal-activa'));
  MAT.logoLado.color.set(token('--senal-activa'));
  for (const m of [MAT.contexto, MAT.plantaTenue, MAT.vueltaLinea]) m.color.set(media);
  for (const m of [MAT.tenue, MAT.lejos]) m.color.set(tenue);
  for (const m of [MAT.senalLinea, MAT.tratoLinea, MAT.techoTrato, MAT.techoOtros, MAT.ruta, MAT.plazas, MAT.losaTapa, MAT.pulso, MAT.pinCara, MAT.logoCara, MAT.realce, MAT.realceTecho, MAT.luz, MAT.faro, MAT.red, MAT.onda]) m.color.set(senal);
  MAT.ocupa.color.set(tinta);
  MAT.eleccion.color.set(tinta);       // la plaza elegida se lee sobre las azules
  MAT.eleccionLinea.color.set(tinta);   // la ocupación se lee sobre el techo azul del trato
  tono.media.set(media);
  tono.senal.set(senal);
  MAT.sumadosLinea.color.copy(tono.media);
}

// Los garages que se suman pasan de tinta media a azul señal.
export function tenirSumados(t) {
  MAT.sumadosLinea.color.copy(tono.media).lerp(tono.senal, t);
}
