// La escena, el guion y los pósters de /para-garages, aparte de paginas/garages.js
// para que el esqueleto y el 3D no editen el mismo archivo. Capa DOM: la composición
// 3D entra solo por lazy(), en un chunk que se pide recién cuando se va a mostrar.
import { lazy } from 'react';
import { GUION_GARAGES } from '../scroll/ajustesGarages';

export const ESCENA = lazy(() => import('../three/ExperienceGarages'));
// Coreografía, arranque (tu garage fuera del mapa) y el interruptor "En borrador".
export const GUION = GUION_GARAGES;
// Pósters de las versiones sin 3D (sin WebGL, ?sin3d o con ahorro de datos): el
// estado final de cada sección y el de control en borrador, sacados del 3D.
export const POSTERS = '/landing/posters/garages';
