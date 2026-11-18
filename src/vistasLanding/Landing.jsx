// La home (ADR-008): el armazón del plano con el contenido, las piezas, la escena
// y el guion de la home. Es la única vista eager (ADR-006). Capa DOM: nunca
// importa three ni @react-three/*; el 3D entra por lazy() desde paginas/home.js.
import { PAGINA_HOME } from '../componentesLanding/inmersiva/paginas/home';
import { PaginaPlano } from '../componentesLanding/inmersiva/ui/PaginaPlano';

export default function LandingPage() {
  return <PaginaPlano pagina={PAGINA_HOME} />;
}
