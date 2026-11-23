import { lazy, Suspense, useEffect, useRef, useState } from "react";

// Capa DOM del logo 3D del cierre: no importa three. El chunk de la escena se
// pide recién cuando el cierre se acerca a la pantalla y solo si hay WebGL.
const GarageLogoEscena = lazy(() => import("./GarageLogoEscena"));

function hayWebGL() {
  try {
    const lienzo = document.createElement("canvas");
    return Boolean(lienzo.getContext("webgl2") || lienzo.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function GarageLogo() {
  const caja = useRef(null);
  const [cerca, setCerca] = useState(false);
  const [visible, setVisible] = useState(false);
  const [webgl] = useState(hayWebGL);

  useEffect(() => {
    const nodo = caja.current;
    if (!nodo || !webgl) return undefined;
    // Uno para cargar con anticipación y otro para animar solo mientras se ve.
    const precarga = new IntersectionObserver(([e]) => e.isIntersecting && setCerca(true), { rootMargin: "400px 0px" });
    const enPantalla = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    precarga.observe(nodo);
    enPantalla.observe(nodo);
    return () => {
      precarga.disconnect();
      enPantalla.disconnect();
    };
  }, [webgl]);

  if (!webgl) return null;

  return (
    <div
      ref={caja}
      className="cta-content relative -mt-4 h-64 w-full max-w-md md:-mt-6 md:h-80 [--logo-cara:var(--color-brand-blue)] [--logo-lado:var(--color-brand-accent-hover)] [--logo-tinta:var(--color-brand-navy)] [--logo-papel:var(--color-brand-surface)] [--logo-cielo:var(--color-brand-sky)]"
      aria-hidden="true"
    >
      {cerca && (
        <Suspense fallback={null}>
          <GarageLogoEscena activo={visible} />
        </Suspense>
      )}
    </div>
  );
}
