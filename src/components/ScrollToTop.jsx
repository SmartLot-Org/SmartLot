import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// La navegación SPA (pushState) conserva window.scrollY: el navegador no
// vuelve arriba solo. El LogoWatermark del landing mide el hero con
// getBoundingClientRect() al entrar por scroll, así que aterrizar a mitad
// de página captura un rect basura -> watermark inclinado cayendo desde
// arriba a la izquierda. Forzamos scroll 0 + refresh de triggers en cada
// cambio de ruta.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Dejar que la nueva ruta pinte antes de re-medir los triggers.
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}
