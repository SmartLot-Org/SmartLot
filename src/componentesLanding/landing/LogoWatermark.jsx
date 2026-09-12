import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';


gsap.registerPlugin(ScrollTrigger);


const TOTAL_FRAMES = 120;
const FRAME_PATH = (i) => `/GIF_IMGS_LOGO/ffout${String(i).padStart(3, '0')}.png`;
// Los frames del gif tienen el logo más chico (con padding) que logoEntero.png:
// arrancamos la reproducción con este zoom para que el tamaño coincida y lo
// bajamos a 1 durante el giro.
const START_FRAME_ZOOM = 1.25;
// Cuántos frames (~40 = 0.66s) reintentamos el swap si el hero aún no tiene
// layout válido (entrada del Hero, fuentes, primer paint tras navegar).
const SWAP_MAX_RETRIES = 40;


// ---------------------------------------------------------------------------
// Caché singleton a nivel módulo: en navegación SPA el componente se
// desmonta/remonta y los `new Image()` arrancarían en `complete === false`,
// dejando el canvas en blanco o estirado justo cuando el swap lo necesita.
// Cargando una sola vez, el remount dibuja sincrónico.
// ---------------------------------------------------------------------------
let cachedFrames = null;
let cachedStartLogo = null;
let preloadStarted = false;

function ensurePreloaded() {
  if (preloadStarted) return;
  preloadStarted = true;
  cachedFrames = [];
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = FRAME_PATH(i);
    cachedFrames.push(img);
  }
  const staticLogo = new Image();
  staticLogo.src = '/logo.png';
  cachedFrames.push(staticLogo);

  cachedStartLogo = new Image();
  cachedStartLogo.src = '/logoEntero.png';
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
  const retryRafRef = useRef(0);


  useEffect(() => {
    ensurePreloaded();
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
    drawImage(cachedFrames?.[frameIndex]);
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
    const mm = gsap.matchMedia();


    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(wrapperRef.current, { opacity: 1, scale: 2.5 });
      gsap.set(staticImgRef.current, { opacity: 1 });
    });


    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const state = { currentFrame: 0 };
      let continuousAnim = null;
      let tl = null;
      swappedInRef.current = false;
      cancelAnimationFrame(retryRafRef.current);


      const getHeroLogo = () => heroRef.current?.querySelector('.floating-logo');
      const getHeroLogoContainer = () => heroRef.current?.querySelector('.hero-logo-container');


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
      gsap.set(canvasRef.current, { opacity: 0 });
      gsap.set(staticImgRef.current, { opacity: 0 });


      // Swap in: capture hero logo position, pin the wrapper there, hide the hero logo.
      // Devuelve true solo si el rect es válido; si no, el caller reintenta.
      const swapIn = () => {
        if (swappedInRef.current) return true;
        const heroLogo = getHeroLogo();
        const heroContainer = getHeroLogoContainer();
        if (!heroLogo) return false;
        const rect = heroLogo.getBoundingClientRect();
        if (!isValidRect(rect)) return false;
        gsap.set(wrapperRef.current, {
          position: 'fixed',
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          scale: 1,
          rotationY: 0,
          rotationX: 0,
          opacity: 1,
          xPercent: 0,
          yPercent: 0,
          transformOrigin: '50% 50%',
          transformPerspective: 1000,
        });
        // The ResizeObserver won't have seen the new wrapper size yet
        // (it fires async), so size the canvas from the rect before drawing
        canvasSizeRef.current = { width: rect.width * 2, height: rect.height * 2 };
        if (isDrawable(cachedStartLogo)) {
          drawImage(cachedStartLogo);
        } else if (isDrawable(cachedFrames?.[0])) {
          drawImage(cachedFrames[0]);
        }
        // Si nada es dibujable aún (primera visita sin caché), no pasa nada:
        // el wrapper ya tiene el tamaño correcto y los frames del onUpdate
        // lo pintan apenas decodifican — sin estirar.
        gsap.set(canvasRef.current, { opacity: 1, scale: 1 });
        gsap.set(heroLogo, { visibility: 'hidden' });
        if (heroContainer) {
          gsap.set(heroContainer, { opacity: 0 });
        }
        swappedInRef.current = true;
        // Si el swap llegó tarde (remount con scroll restaurado a mitad de
        // página), el tween con scrub ya grabó valores iniciales basura —
        // forzar re-grabado para interpolar desde el rect real.
        if (tl && tl.progress() > 0) tl.invalidate();
        return true;
      };


      // Nunca animar desde un rect basura: quedarse invisible y reintentar
      // mientras el hero termina de entrar / laid-outear.
      const swapInWithRetry = (attempt = 0) => {
        if (swappedInRef.current) return;
        if (swapIn()) return;
        if (attempt < SWAP_MAX_RETRIES) {
          retryRafRef.current = requestAnimationFrame(() => swapInWithRetry(attempt + 1));
        }
      };


      // Swap out: restore hero logo, hide the wrapper
      const swapOut = () => {
        cancelAnimationFrame(retryRafRef.current);
        swappedInRef.current = false;
        const heroLogo = getHeroLogo();
        const heroContainer = getHeroLogoContainer();
        if (heroLogo) {
          gsap.set(heroLogo, { visibility: 'visible' });
        }
        if (heroContainer) {
          gsap.set(heroContainer, { opacity: 1 });
        }
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
          onEnter: () => swapInWithRetry(),
          onEnterBack: () => swapInWithRetry(),
          onLeaveBack: (self) => {
            // Force the lagging scrub to finish rewinding NOW, so its
            // pending renders can't override the restore below
            self.getTween()?.progress(1);
            tl.progress(0);
            swapOut();
          },
          onToggle: (self) => {
            // Red de seguridad para remounts SPA que aterrizan con el trigger
            // ya activo (scroll restaurado): asegurar el swap; si volvimos
            // arriba del start, restaurar el hero.
            if (self.isActive) swapInWithRetry();
            else if (self.progress === 0) swapOut();
          },
          onUpdate: (self) => {
            if (self.progress >= 1 && !continuousAnim) {
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


      // Phase 2: Play the frame animation on canvas. The frames pad the logo
      // smaller than logoEntero, so they start zoomed to match and ease to 1.
      tl.fromTo(canvasRef.current,
        { scale: START_FRAME_ZOOM },
        { scale: 1, duration: 0.2, ease: "power1.out", immediateRender: false },
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


      // Phase 4: Animate to final watermark position
      .to(wrapperRef.current, {
        top: () => window.innerHeight * 0.1,
        left: () => window.innerWidth * 0.5,
        xPercent: -50,
        yPercent: 0,
        scale: 2.8,
        rotationY: 60,
        rotationX: 12,
        duration: 0.78,
        ease: "power2.inOut",
      }, 0.02)


      // Phase 5: Settle
      .to(wrapperRef.current, {
        duration: 0.20,
        ease: "power1.out",
      }, 0.80);

      // Cleanup del contexto: matar el giro infinito (nace en un callback
      // async de scroll y matchMedia no siempre lo rastrea) y cancelar el
      // retry pendiente para no tocar nodos desmontados.
      return () => {
        cancelAnimationFrame(retryRafRef.current);
        if (continuousAnim) {
          continuousAnim.kill();
          continuousAnim = null;
        }
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
