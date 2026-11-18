// La home como página del plano: el contrato que recibe ui/PaginaPlano.jsx.
// Capa DOM: no importa three; el 3D entra solo por lazy().
import { lazy } from 'react';
import { CTA, META, PIE, SECCIONES } from '../contenido/secciones';
import { useUI } from '../estado/store';
import { COREOGRAFIA } from '../scroll/coreografia';
import { aplicarComparacion } from '../scroll/estado';
import { Comparador } from '../ui/Comparador';
import { Dato } from '../ui/Dato';
import { ElegirDia } from '../ui/ElegirDia';
import { TablaConsumos } from '../ui/TablaConsumos';

export const PAGINA_HOME = {
  id: 'home',
  meta: META,                 // { titulo, descripcion }
  cta: CTA.principal,         // Registrate → /register
  enlace: CTA.secundaria,     // Para garages: la otra página, en la barra y el pie
  pie: PIE,
  secciones: SECCIONES,
  // Las piezas que solo mueven el dibujo no van en la versión sin 3D.
  piezas: {
    comparador: { componente: Comparador, soloConEscena: true },
    dato: { componente: Dato, soloConEscena: true },
    elegirDia: { componente: ElegirDia, soloConEscena: true },
    consumos: { componente: TablaConsumos },
  },
  // La composición 3D de la home: un chunk aparte que se pide solo si se va a mostrar.
  escena: lazy(() => import('../three/Experience')),
  guion: {
    coreografia: COREOGRAFIA,
    // El deslizador antes / con SmartLot lleva el dibujo hacia el estado del trato
    // mientras se está en el problema, y recompone sin esperar al scroll.
    ajustar: (destino, avances, vertical) =>
      aplicarComparacion(destino, useUI.getState().comparar, avances, vertical),
    suscribir: (recomponer) => useUI.subscribe((s, previo) => {
      if (s.comparar !== previo.comparar) recomponer();
    }),
  },
  posters: '/landing/posters',
  intro: true,                // el cajetín de entrada, una vez por sesión
};
