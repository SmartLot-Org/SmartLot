// Geometría 3D del logo a partir de la silueta de formaLogo.js. La usan las dos
// landings (versión liviana) y el script del modelo de alta (scripts/logo3d).
import { ExtrudeGeometry, Shape, Vector2 } from 'three';
import { contornosLogo } from './formaLogo.js';

export function formasLogo(detalle = 1) {
  return contornosLogo(detalle).map((c) => new Shape(c.map(([x, y]) => new Vector2(x, y))));
}

// Extrusión centrada en Z. Con bisel, `profundidad` es el grosor total igual.
// Grupos: 0 = caras (frente y dorso), 1 = laterales.
export function geometriaLogo({ profundidad = 0.08, bisel = 0, segmentosBisel = 1, detalle = 1 } = {}) {
  const nucleo = Math.max(0.0001, profundidad - bisel * 2);
  const g = new ExtrudeGeometry(formasLogo(detalle), {
    depth: nucleo,
    bevelEnabled: bisel > 0,
    bevelThickness: bisel,
    bevelSize: bisel * 0.8,
    bevelOffset: -bisel * 0.8,     // el bisel come hacia adentro: la silueta no engorda
    bevelSegments: segmentosBisel,
    curveSegments: 1,              // las curvas ya vienen muestreadas en formaLogo
  });
  g.translate(0, 0, -nucleo / 2);
  g.computeVertexNormals();
  return g;
}
