// /para-garages (ADR-008, ADR-014): el armazón del plano con el contenido, las
// piezas, la escena y el guion de garages. Sigue en lazy() (ADR-006): su chunk trae
// solo lo propio de la página, porque el armazón ya viene con la home. Capa DOM:
// nunca importa three; el 3D entra por lazy() desde paginas/garagesEscena.js.
import { PAGINA_GARAGES } from '../componentesLanding/inmersiva/paginas/garages';
import { PaginaPlano } from '../componentesLanding/inmersiva/ui/PaginaPlano';

export default function ParaGarages() {
  return <PaginaPlano pagina={PAGINA_GARAGES} />;
}
