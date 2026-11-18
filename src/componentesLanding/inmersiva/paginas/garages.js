// /para-garages como parámetro del armazón: el contrato que recibe ui/PaginaPlano.jsx.
// Capa DOM: no importa three; el 3D entra solo por lazy(), desde garagesEscena.js.
import { CTA, ENLACE, META, PIE, SECCIONES } from '../contenido/garages';
import { FichaBusqueda } from '../ui/garages/FichaBusqueda';
import { TablaConsumosGarage } from '../ui/garages/TablaConsumosGarage';
import { Visibilidad } from '../ui/garages/Visibilidad';
import { ESCENA, GUION, POSTERS } from './garagesEscena';
import '../garages.css';

export const PAGINA_GARAGES = {
  id: 'garages',
  meta: META,
  cta: CTA,
  enlace: ENLACE,
  pie: PIE,
  secciones: SECCIONES,
  // s.piezas = ['busqueda'] pone <FichaBusqueda /> en la nota. Ninguna es solo del 3D:
  // las tres se leen y se usan también sin escena.
  piezas: {
    busqueda: { componente: FichaBusqueda },
    consumos: { componente: TablaConsumosGarage },
    // Sin escena, el interruptor pone el póster del estado elegido en lugar de la figura.
    visibilidad: { componente: Visibilidad, reemplazaFigura: true },
  },
  // En null hasta la etapa 4: la página va en el flujo sin 3D ni figuras.
  escena: ESCENA,
  guion: GUION,
  posters: POSTERS,
  intro: false, // el cajetín de entrada es de la home
};
