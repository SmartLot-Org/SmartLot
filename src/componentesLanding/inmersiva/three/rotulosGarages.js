// Los rótulos del dibujo de /para-garages, para Rotulos y Proyector. Los textos salen de
// contenido/garages.js; las distancias, del mundo (metros por la calle), como la cota
// de 300 m de la home. Decorativos: el contenido real está en las secciones.
import { ROTULOS } from '../contenido/garages';
import { hallazgo } from './hallazgos';
import { ANCLAS, G1, MUNDO, SEDES } from './mundo';
import { vivo } from './vivo';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const metros = (m) => `${m} ${ROTULOS.distancia.unidad}`;
// La distancia va encima del rótulo "Sede" (22 px de alto y 4 de aire).
const ENCIMA_DE_LA_SEDE = '-50%,calc(-100% - 26px)';

export const ROTULOS_GARAGES = [
  // Tu garage lleva el cartel E solo cuando está en el mapa de las empresas.
  { id: 'g1', ancla: ANCLAS.g1, clase: 'plano-senal-e', texto: ROTULOS.senal, opacidad: (fx) => vivo.aparecen * (1 - fx.tapa) * (1 - fx.fuera) },
  { id: 'g2', ancla: ANCLAS.g2, clase: 'plano-senal-e', texto: ROTULOS.senal, opacidad: () => vivo.aparecen },
  { id: 'g3', ancla: ANCLAS.g3, clase: 'plano-senal-e', texto: ROTULOS.senal, opacidad: () => vivo.aparecen },
  // "Tu garage", debajo de su esquina de adelante; cuando sale la flecha, lo nombra la
  // tarjeta de la búsqueda (FichaMapa.jsx) y el rótulo se va para no repetirlo.
  { id: 'tuyo', ancla: [G1.x1, 0, G1.z1], clase: 'plano-rotulo', texto: ROTULOS.garage, debajo: true, opacidad: (fx) => vivo.aparecen * (1 - fx.tapa) * (1 - limitar(fx.ficha * 2)) },
  ...SEDES.map((s, i) => ({
    id: `sede-${i}`, ancla: ANCLAS.sedes[i], clase: 'plano-rotulo', texto: ROTULOS.sede,
    opacidad: (fx) => vivo.aparecen * fx.sedes * (1 - fx.tapa),
  })),
  // La distancia por la calle aparece sobre cada sede cuando su anillo encuentra tu garage.
  ...SEDES.map((s, i) => ({
    id: `distancia-${i}`, ancla: ANCLAS.sedes[i], clase: 'plano-cota', texto: metros(s.metros), ajuste: ENCIMA_DE_LA_SEDE,
    opacidad: (fx) => limitar((hallazgo(fx.busqueda, i) - 0.9) / 0.1) * (1 - fx.fuera) * (1 - fx.tapa),
  })),
  // La cota del recorrido del pedido, como en la home. Cuando la búsqueda vuelve, deja
  // lugar a la distancia sobre la sede, que dice lo mismo.
  {
    id: 'cota', ancla: ANCLAS.cota, clase: 'plano-cota', texto: metros(MUNDO.ruta.metros),
    opacidad: (fx) => limitar((fx.traza - 0.55) / 0.2) * (1 - fx.tapa) * (1 - fx.fuera) * (1 - fx.busqueda),
  },
];
