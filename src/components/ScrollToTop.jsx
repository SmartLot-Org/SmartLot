import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// La navegación SPA (pushState) conserva window.scrollY: el navegador no
// vuelve arriba solo. El scroll debe ser instantáneo: con el
// `scroll-behavior: smooth` global (index.css) un scrollTo(0,0) común se
// convierte en una glidiada animada que atraviesa la zona activa de los
// ScrollTrigger recién creados (el LogoWatermark del landing se scrubea
// entero en fast-forward al volver de /para-garages). `behavior: 'instant'`
// gana sobre el CSS, y el layout effect corre antes de que la ruta nueva
// monte sus triggers, así nacen ya en scroll 0.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // Dejar que la nueva ruta pinte antes de re-medir los triggers.
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}
