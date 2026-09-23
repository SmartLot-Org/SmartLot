import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';


gsap.registerPlugin(ScrollTrigger);


const TOTAL_FRAMES = 120;
const FRAME_PATH = (i) => `/GIF_IMGS_LOGO/ffout${String(i).padStart(3, '0')}.png`;
// Los frames tienen el logo más chico (con padding para el giro) que
// logoEntero.png: arrancamos con este zoom para que coincida y lo bajamos
// a 1 durante el giro.
// Medición al píxel (bbox con alfa > 100, arte central sin halo/sombra):
//   logoEntero.png 1408x768 → contenido 1148x441 (aspecto 2.603)
//   ffout001.png    800x450 → contenido  426x164 (aspecto 2.598)
// El 1.25 iguala el *área* aparente (ancho −6.7% / alto +7.4%, se compensan
// a la vista) y es el tamaño que el recorrido original usa en todo el giro,
// así que se mantiene: achicarlo más se notaba como encogimiento.
const START_FRAME_ZOOM = 1.25;
// Con el zoom 1.25 el centro del frame0 queda corrido respecto al de
// logoEntero (el contenido del frame viene descentrado): se compensa acá y
// se lleva a 0 junto con el zoom. Medido al píxel sobre el mismo bbox.
const FRAME0_ALIGN_X = -5.23;
const FRAME0_ALIGN_Y = -8.12;

// El recorrido del watermark (flip-book + swap + vuelo) asume el hero de dos
// columnas que arranca en lg. Por debajo (mobile/tablet) no corre nada: ni
// timeline, ni swap, ni la descarga de ~8 MB de frames — el logo del hero
// queda tal cual. El corte sigue al layout, no al dispositivo.
const DESKTOP_QUERY = '(min-width: 1024px)';
const MOBILE_QUERY = '(max-width: 1023px)';


// ---------------------------------------------------------------------------
// Caché singleton a nivel módulo: en navegación SPA el componente se
// desmonta/remonta y los `new Image()` arrancarían en `complete === false`,
// dejando el canvas en blanco o estirado justo cuando el swap lo necesita.
// Cargando una sola vez, el remount dibuja sincrónico.
// ---------------------------------------------------------------------------
let cachedFrames = null;
let cachedStartLogo = null;
let preloadStarted = false;

// Los 120 frames pesan ~8 MB: se piden de a tandas (y recién cuando el
// usuario scrollea) para no competir con la carga inicial.
const FRAME_BATCH = 10;

function scheduleBatch(cb) {
  if ('requestIdleCallback' in window) window.requestIdleCallback(cb, { timeout: 300 });
  else window.setTimeout(cb, 100);
}

function loadFrameBatch(startIndex = 0) {
  const end = Math.min(startIndex + FRAME_BATCH, TOTAL_FRAMES);
  for (let i = startIndex; i < end; i++) {
    const img = cachedFrames[i];
    if (!img || img.src) continue;
    img.src = FRAME_PATH(i + 1);
    if (typeof img.decode === 'function') img.decode().catch(() => {});
  }
  if (end < TOTAL_FRAMES) scheduleBatch(() => loadFrameBatch(end));
}

function ensurePreloaded() {
  if (preloadStarted) return;
  preloadStarted = true;
  cachedFrames = [];
  // Sin src todavía: cada frame se resuelve cuando le toca su tanda, así el
  // índice del array sigue mapeando 1:1 con ffoutNNN.png.
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    cachedFrames.push(new Image());
  }
  const staticLogo = new Image();
  staticLogo.src = '/logo.png';
  cachedFrames.push(staticLogo);

  cachedStartLogo = new Image();
  cachedStartLogo.src = '/logoEntero.png';

  loadFrameBatch();
}

function isDrawable(img) {
  return !!img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
}

// Un rect solo sirve si tiene tamaño real. Medir un nodo oculto, sin layout
// o aún no pintado (todo ceros) era lo que pineaba el wrapper en la esquina
// superior izquierda y el timeline igual lo bajaba inclinado (rotY 60°).
function isValidRect(rect) {
  return !!rect && rect.width > 10 && rect.height > 10;
}


export default function LogoWatermark({ heroRef }) {
  const container = useRef(null);
  const canvasRef = useRef(null);
  const staticImgRef = useRef(null);
  const wrapperRef = useRef(null);
  const canvasSizeRef = useRef({ width: 0, height: 0 });
  const lastImgRef = useRef(null);
  const swappedInRef = useRef(false);
  const drawRetryRafRef = useRef(0);


  useEffect(() => {
    const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileMq = window.matchMedia(MOBILE_QUERY);
    // Nunca se descarga nada en mobile: ahí el recorrido no corre.
    const kick = () => {
      if (!reduceMq.matches && !mobileMq.matches) ensurePreloaded();
    };

    // Los frames son el momento de marca del scroll: se piden recién con la
    // primera señal real de scroll (nada de precarga automática en idle, que
    // bajaba ~8 MB sin que el usuario hubiera pedido nada). Con reduce no hay
    // flip-book: no se carga nada.
    if (!reduceMq.matches && !mobileMq.matches) {
      if (window.scrollY > 0) {
        kick();
      } else {
        window.addEventListener('scroll', kick, { once: true, passive: true });
        window.addEventListener('wheel', kick, { once: true, passive: true });
        window.addEventListener('touchmove', kick, { once: true, passive: true });
      }
    }
    // Reduce apagado o resize mobile → desktop a mitad de sesión: recién ahí
    // empieza la descarga.
    const onModeChange = (e) => { if (!e.matches) kick(); };
    reduceMq.addEventListener('change', onModeChange);
    mobileMq.addEventListener('change', onModeChange);

    // El layout puede moverse tras el mount (fuentes, imágenes con distinto
    // timing de caché al volver por navegación) — re-medir una vez estable.
    let cancelled = false;
    const refresh = () => { if (!cancelled) ScrollTrigger.refresh(); };
    if (document.fonts?.ready) {
      document.fonts.ready.then(refresh).catch(() => {});
    }
    window.addEventListener('load', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('load', refresh);
      window.removeEventListener('scroll', kick);
      window.removeEventListener('wheel', kick);
      window.removeEventListener('touchmove', kick);
      reduceMq.removeEventListener('change', onModeChange);
      mobileMq.removeEventListener('change', onModeChange);
    };
  }, []);


  const drawImage = useCallback((img) => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawable(img)) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;


    const size = canvasSizeRef.current;
    if (size.width > 10 && size.height > 10) {
      canvas.width = Math.round(size.width);
      canvas.height = Math.round(size.height);
    }
    if (!canvas.width || !canvas.height) return;


    ctx.clearRect(0, 0, canvas.width, canvas.height);


    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = canvas.width / canvas.height;
    if (!Number.isFinite(imgAspect) || !Number.isFinite(canvasAspect) || canvasAspect <= 0) return;
    let drawW, drawH, drawX, drawY;


    if (imgAspect > canvasAspect) {
      drawW = canvas.width;
      drawH = canvas.width / imgAspect;
      drawX = 0;
      drawY = (canvas.height - drawH) / 2;
    } else {
      drawH = canvas.height;
      drawW = canvas.height * imgAspect;
      drawX = (canvas.width - drawW) / 2;
      drawY = 0;
    }


    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    lastImgRef.current = img;
  }, []);


  const drawFrame = useCallback((frameIndex) => {
    if (!cachedFrames) return false;
    // Pinta el frame pedido o, si todavía no decodificó, el más cercano ya
    // disponible hacia atrás: el canvas nunca queda vacío durante el giro.
    const start = Math.min(Math.max(frameIndex, 0), cachedFrames.length - 1);
    for (let i = start; i >= 0; i--) {
      if (isDrawable(cachedFrames[i])) {
        drawImage(cachedFrames[i]);
        return true;
      }
    }
    return false;
  }, [drawImage]);


  // Sync canvas internal resolution to display size via ResizeObserver,
  // redrawing whatever was on screen so it doesn't stay stretched/blurry
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;


    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 10 && height > 10) {
        canvasSizeRef.current = { width: width * 2, height: height * 2 };
        if (lastImgRef.current) drawImage(lastImgRef.current);
      }
    });


    observer.observe(canvas);
    return () => observer.disconnect();
  }, [drawImage]);


  useGSAP(() => {
    if (!wrapperRef.current || !canvasRef.current || !staticImgRef.current) return;
    const mm = gsap.matchMedia();


    mm.add("(prefers-reduced-motion: reduce)", () => {
      // Watermark estático: misma posición del recorrido (arriba centro,
      // 10vh) pero con geometría fija explícita (antes el wrapper quedaba
      // sin tamaño ni top/left: invisible/descolocado). Sin medición, sin
      // scroll y sin transformaciones animadas.
      gsap.set(wrapperRef.current, {
        position: 'fixed',
        top: '10vh',
        left: '50vw',
        width: 'min(65vmin, 640px)',
        height: 'min(65vmin, 640px)',
        xPercent: -50,
        yPercent: 0,
        scale: 1,
        rotationY: 0,
        rotationX: 0,
        opacity: 1,
        transformOrigin: '50% 50%',
      });
      gsap.set(canvasRef.current, { opacity: 0 });
      gsap.set(staticImgRef.current, { opacity: 0.1 });
    });


    // El recorrido vive sólo en desktop (hero de dos columnas): en mobile el
    // wrapper nunca se activa, el logo del hero queda intacto y no hay scroll
    // que animar. El estado reduce queda como estaba: watermark estático sutil.
    mm.add(`(prefers-reduced-motion: no-preference) and ${DESKTOP_QUERY}`, () => {
      const state = { currentFrame: 0 };
      let continuousAnim = null;
      let tl = null;
      // Geometría fija (viewport coords) donde se pineó el swap. No se
      // re-mide con el scroll: el wrapper es fixed, así que un refresh a
      // mitad del scrub debe re-proyectar desde acá, no desde el ancla ya
      // scrolleada fuera de pantalla.
      let swapGeom = { top: 0, left: 0 };
      swappedInRef.current = false;

      if (!heroRef.current) return;


      const getHeroLogo = () => heroRef.current?.querySelector('.floating-logo');
      const getHeroLogoContainer = () => heroRef.current?.querySelector('.hero-logo-container');
      // Ancla estable: caja de reposo del logo del hero. No la anima ni la
      // entrada del Hero ni el float infinito, así que su rect es válido y
      // definitivo apenas hay layout, sin carreras de timing.
      const getAnchor = () => heroRef.current?.querySelector('.hero-logo-anchor');

      // Rect del ancla en coords de viewport, o null si aún no hay layout
      // válido (primer paint, fonts, remount).
      const measureAnchor = () => {
        const el = getAnchor();
        if (!el) return null;
        const r = el.getBoundingClientRect();
        if (!isValidRect(r)) return null;
        return { left: r.left, top: r.top, width: r.width, height: r.height };
      };

      const hideHeroLogo = () => {
        const heroLogo = getHeroLogo();
        const heroContainer = getHeroLogoContainer();
        if (heroLogo) gsap.set(heroLogo, { visibility: 'hidden' });
        if (heroContainer) gsap.set(heroContainer, { opacity: 0 });
      };

      // El visibility/opacity sobre nodos del Hero es un efecto colateral
      // fuera del contexto GSAP: se restaura a mano, y siempre.
      const restoreHeroLogo = () => {
        const heroLogo = getHeroLogo();
        const heroContainer = getHeroLogoContainer();
        if (heroLogo) gsap.set(heroLogo, { visibility: 'visible' });
        if (heroContainer) gsap.set(heroContainer, { opacity: 1 });
      };


      // Estado pre-swap determinista: invisible Y pineado en fixed. Si el swap
      // fallara, el wrapper queda oculto en vez de animarse deformado desde
      // la esquina (el `position: absolute` sin top/left del CSS base).
      gsap.set(wrapperRef.current, {
        position: 'fixed',
        top: 0,
        left: 0,
        xPercent: 0,
        yPercent: 0,
        scale: 1,
        rotationY: 0,
        rotationX: 0,
        opacity: 0,
        transformOrigin: '50% 50%',
        transformPerspective: 1000,
      });
      gsap.set(canvasRef.current, {
        opacity: 0,
        scale: 1,
        xPercent: 0,
        yPercent: 0,
        transformOrigin: '50% 50%',
      });
      gsap.set(staticImgRef.current, { opacity: 0 });


      // Swap in: pinea el wrapper sobre la caja de reposo del logo del hero
      // (el ancla) y oculta el logo real. Se llama desde los callbacks del
      // ScrollTrigger (onEnter/onToggle/onRefresh), nunca desde timers: si
      // el ancla aún no tiene layout válido, el próximo refresh (ruta,
      // fuentes, resize) reintenta solo.
      const swapIn = () => {
        const r = measureAnchor();
        if (!r) return false;

        if (swappedInRef.current) {
          // Ya activo: un refresh movió el layout (resize, fuentes). El
          // timeline re-evalúa sus valores function-based al invalidarse;
          // acá se refresca la geometría no animada (tamaño) y, si el
          // playhead está en 0, la posición.
          const p = tl ? tl.progress() : 0;
          gsap.set(wrapperRef.current, { width: r.width, height: r.height });
          if (p === 0) {
            swapGeom = { top: r.top, left: r.left };
            gsap.set(wrapperRef.current, { top: r.top, left: r.left });
          }
          canvasSizeRef.current = { width: r.width * 2, height: r.height * 2 };
          if (lastImgRef.current) drawImage(lastImgRef.current);
          if (tl) tl.invalidate();
          return true;
        }

        gsap.set(wrapperRef.current, {
          position: 'fixed',
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
          scale: 1,
          rotationY: 0,
          rotationX: 0,
          xPercent: 0,
          yPercent: 0,
          opacity: 1,
          transformOrigin: '50% 50%',
          transformPerspective: 1000,
        });
        swapGeom = { top: r.top, left: r.left };
        // The ResizeObserver won't have seen the new wrapper size yet
        // (it fires async), so size the canvas from the rect before drawing
        canvasSizeRef.current = { width: r.width * 2, height: r.height * 2 };
        if (isDrawable(cachedFrames?.[0])) {
          // Camino principal: frame0 con zoom + offset calibrados ya
          // aplicados → el swap es continuo y el scroll solo interpola
          // (sin el salto 1 → zoom del fromTo anterior).
          gsap.set(canvasRef.current, {
            opacity: 1,
            scale: START_FRAME_ZOOM,
            xPercent: FRAME0_ALIGN_X,
            yPercent: FRAME0_ALIGN_Y,
            transformOrigin: '50% 50%',
          });
          drawImage(cachedFrames[0]);
        } else {
          // Primera visita (frames aún sin decodificar): dibujo exacto sin
          // zoom; el retry de dibujo pinta el frame0 apenas esté listo.
          gsap.set(canvasRef.current, {
            opacity: 1,
            scale: 1,
            xPercent: 0,
            yPercent: 0,
            transformOrigin: '50% 50%',
          });
          if (isDrawable(cachedStartLogo)) drawImage(cachedStartLogo);
          // Red de seguridad: si los frames decodifican después del swap,
          // pinta la posición actual del scrub apenas haya uno real.
          startDrawRetry();
        }
        // Si nada es dibujable aún, no pasa nada: el wrapper ya tiene el
        // tamaño correcto y los frames del onUpdate lo pintan apenas
        // decodifican — sin estirar.
        hideHeroLogo();
        swappedInRef.current = true;
        // Re-grabar inicios/fines con el rect fresco: en el caso normal
        // (onEnter con playhead ~0) alinea el timeline con el swap antes de
        // que el scrub avance; si el swap llegó tarde (remount con scroll
        // restaurado), corrige los valores iniciales que el scrub ya grabó.
        if (tl) tl.invalidate();
        return true;
      };


      // Reintento acotado de dibujo (≈10s): mientras el frame exacto del
      // scrub no esté decodificado, mantiene en el canvas el frame real más
      // cercano disponible y se apaga solo cuando llega el pedido.
      const startDrawRetry = (attempt = 0) => {
        cancelAnimationFrame(drawRetryRafRef.current);
        if (attempt > 600) return;
        const target = Math.round(state.currentFrame);
        if (isDrawable(cachedFrames?.[target])) return;
        drawFrame(target);
        drawRetryRafRef.current = requestAnimationFrame(() => startDrawRetry(attempt + 1));
      };


      // Swap out: restore hero logo, hide the wrapper
      const swapOut = () => {
        cancelAnimationFrame(drawRetryRafRef.current);
        swappedInRef.current = false;
        restoreHeroLogo();
        gsap.set(wrapperRef.current, { opacity: 0 });
        gsap.set(canvasRef.current, { opacity: 0 });
        gsap.set(staticImgRef.current, { opacity: 0 });
      };


      tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          // On viewports taller than the hero, "bottom bottom" resolves to a
          // negative scroll offset (unreachable), so progress can never
          // return to exactly 0 at the top of the page. Clamp it to 0.
          start: () => {
            if (!heroRef.current) return 0;
            const rect = heroRef.current.getBoundingClientRect();
            const idealStart = rect.bottom + window.scrollY - window.innerHeight;
            return Math.max(idealStart, 0);
          },
          end: "+=200%",
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          // Único punto de decisión del swap: activo → swap in, en 0 → swap
          // out. Sin reintentos con timers ni redes de seguridad paralelas:
          // si el ancla no tiene layout todavía, el próximo refresh
          // (ScrollToTop en cada ruta, fonts.ready, load, resize) reintenta.
          onEnter: () => swapIn(),
          onEnterBack: () => swapIn(),
          onLeaveBack: (self) => {
            // Force the lagging scrub to finish rewinding NOW, so its
            // pending renders can't override the restore below
            self.getTween()?.progress(1);
            tl.progress(0);
            swapOut();
          },
          onToggle: (self) => {
            // Remounts SPA que aterrizan con el trigger ya activo (p. ej.
            // viewport más alto que el hero: start clampado a 0).
            if (self.isActive) swapIn();
            else if (self.progress === 0) swapOut();
          },
          onRefresh: (self) => {
            // Tras cada refresh el layout ya está asentado: re-alinear el
            // swap (resize, fuentes, lazy sections) o restaurar si estamos
            // arriba de todo.
            if (self.isActive) swapIn();
            else if (self.progress === 0) swapOut();
          },
          onUpdate: (self) => {
            if (self.progress >= 1 && !continuousAnim && wrapperRef.current) {
              continuousAnim = gsap.to(wrapperRef.current, {
                rotationY: "+=360",
                duration: 20,
                ease: "none",
                repeat: -1,
              });
            }
            if (self.progress < 1 && continuousAnim) {
              continuousAnim.kill();
              continuousAnim = null;
            }
          },
        }
      });


      // Phase 2: el canvas arranca ya calibrado desde el swapIn (zoom +
      // offset que igualan al hero) y se normaliza mientras giran los
      // frames — continuo desde el tick 0 de scroll, sin la
      // discontinuidad 1 → zoom del fromTo anterior.
      tl.fromTo(canvasRef.current,
        { scale: START_FRAME_ZOOM, xPercent: FRAME0_ALIGN_X, yPercent: FRAME0_ALIGN_Y },
        { scale: 1, xPercent: 0, yPercent: 0, duration: 0.2, ease: "power1.out", immediateRender: false },
      0.02)
      .to(state, {
        currentFrame: TOTAL_FRAMES - 1,
        duration: 0.28,
        ease: "none",
        onUpdate: () => {
          drawFrame(Math.round(state.currentFrame));
        }
      }, 0.02)


      // Phase 3: Crossfade from canvas to static logo
      .to(canvasRef.current, { opacity: 0, duration: 0.03 }, 0.30)
      .to(staticImgRef.current, { opacity: 1, duration: 0.03 }, 0.30)

      // Phase 3b: Recede — el logo cede el escenario al contenido. Tras el
      // crossfade baja a la opacidad watermark (la misma del estado estático
      // de reduce) para que el heading del BentoGrid, que coincide en
      // pantalla con el vuelo/settle, conserve contraste pleno.
      .fromTo(staticImgRef.current,
        { opacity: 1 },
        { opacity: 0.1, duration: 0.3, ease: "power2.out", immediateRender: false },
      0.33)


      // Phase 4: Animate to final watermark position. fromTo con el punto de
      // swap guardado en closure: cada invalidación (invalidateOnRefresh)
      // re-graba inicios/fines de forma determinística — nunca desde un
      // estado intermedio del scrub ni desde el ancla ya scrolleada.
      .fromTo(wrapperRef.current,
        {
          top: () => swapGeom.top,
          left: () => swapGeom.left,
          xPercent: 0,
          yPercent: 0,
          scale: 1,
          rotationY: 0,
          rotationX: 0,
        },
        {
          top: () => window.innerHeight * 0.1,
          left: () => window.innerWidth * 0.5,
          xPercent: -50,
          yPercent: 0,
          scale: 2.8,
          rotationY: 60,
          rotationX: 12,
          duration: 0.78,
          ease: "power2.inOut",
          immediateRender: false,
        },
      0.02)


      // Phase 5: Settle
      .to(wrapperRef.current, {
        duration: 0.20,
        ease: "power1.out",
      }, 0.80);

      // Cleanup del contexto: matar el giro infinito (nace en un callback
      // async de scroll y matchMedia no siempre lo rastrea), cancelar los
      // reintentos de dibujo y restaurar SIEMPRE el logo del hero. El
      // visibility:hidden es un efecto colateral fuera del contexto GSAP:
      // si el unmount agarra el swap activo (navegar a /para-garages
      // scrolleado) no debe quedar pegado.
      return () => {
        cancelAnimationFrame(drawRetryRafRef.current);
        if (continuousAnim) {
          continuousAnim.kill();
          continuousAnim = null;
        }
        restoreHeroLogo();
      };
    });


    return () => mm.revert();
  }, { scope: container, dependencies: [heroRef, drawFrame], revertOnUpdate: true });


  return (
    <div ref={container} className="fixed inset-0 pointer-events-none z-[5]">
      <div ref={wrapperRef} className="logo-watermark" style={{ opacity: 0 }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0 }}
          role="img"
          aria-label="SmartLot animated logo transition"
        />
        <img
          ref={staticImgRef}
          src="/logo.png"
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
          style={{ opacity: 0 }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
