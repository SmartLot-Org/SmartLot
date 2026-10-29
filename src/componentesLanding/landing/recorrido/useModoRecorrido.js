import { useEffect, useState } from 'react';

const CONSULTA_REDUCIR = '(prefers-reduced-motion: reduce)';

// Se crea un contexto solo para preguntar y se libera enseguida: los
// navegadores limitan cuántos contextos WebGL conviven por página.
function soportaWebGL2() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

// "inmersivo": escenario fijo con la maqueta 3D. "estatico": flujo normal con
// una planta SVG por paso, para quien no tiene WebGL2, prefiere menos
// movimiento o pide la versión sin 3D con ?sin3d.
export default function useModoRecorrido() {
  const [webgl] = useState(soportaWebGL2);
  const [sin3d] = useState(() => new URLSearchParams(window.location.search).has('sin3d'));
  const [reducir, setReducir] = useState(() => window.matchMedia(CONSULTA_REDUCIR).matches);

  useEffect(() => {
    const mq = window.matchMedia(CONSULTA_REDUCIR);
    const alCambiar = (e) => setReducir(e.matches);
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, []);

  return webgl && !sin3d && !reducir ? 'inmersivo' : 'estatico';
}
