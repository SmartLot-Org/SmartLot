import { useRef, useMemo } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function seededRandom(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const shapes = ['circle', 'diamond', 'dot'];
// Familia del azul señal: anclado en #2563EB, sin azules de stock.
const colors = ['#2563EB', '#1D4ED8', '#3B82F6', '#60A5FA', '#93C5FD'];

export default function InteractiveBackground({ 
  count = 45,
  interactionRadius = 120,
  repelForce = 60
}) {
  const containerRef = useRef();
  const particlesRef = useRef([]);

 const particleData = useMemo(() =>
    [...Array(count)].map((_, i) => ({
      top: `${seededRandom(i * 13) * 100}vh`,
      left: `${seededRandom(i * 17) * 100}vw`,
      shape: shapes[i % shapes.length],
      color: colors[i % colors.length],
      size: 3 + seededRandom(i * 7) * 4,
      opacity: 0.15 + seededRandom(i * 23) * 0.2,
      scale: seededRandom(i * 29) * 1.2 + 0.6,
    })),
  [count]);

  useGSAP((context, contextSafe) => {
    let mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const wrappers = gsap.utils.toArray('.particle-wrapper');
      wrappers.forEach((wrapper) => {
        gsap.to(wrapper, {
          y: `-=${gsap.utils.random(100, 200)}`,
          x: `+=${gsap.utils.random(-40, 40)}`,
          duration: gsap.utils.random(15, 30),
          ease: "none",
          repeat: -1,
          yoyo: true
        });
      });

      const xTos = particlesRef.current.map(el => gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" }));
      const yTos = particlesRef.current.map(el => gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" }));

      const onMouseMove = contextSafe((e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        particlesRef.current.forEach((el, index) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const elX = rect.left + rect.width / 2;
          const elY = rect.top + rect.height / 2;

          const distX = elX - mouseX;
          const distY = elY - mouseY;
          const distance = Math.sqrt(distX * distX + distY * distY);

          if (distance < interactionRadius) {
            const force = (interactionRadius - distance) / interactionRadius;
            const moveX = (distX / distance) * force * repelForce;
            const moveY = (distY / distance) * force * repelForce;

            xTos[index](moveX);
            yTos[index](moveY);
          } else {
            xTos[index](0);
            yTos[index](0);
          }
        });
      });

      window.addEventListener('mousemove', onMouseMove, { passive: true });
      
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
      };
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set('.particle', { opacity: 0.15 });
    });

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-brand-bg">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_20%_20%,rgba(37,99,235,0.04)_0%,transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(96,165,250,0.03)_0%,transparent_50%)]"></div>

      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(37,99,235,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.08) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      ></div>

      {particleData.map((p, i) => (
        <div
          key={i}
          className="particle-wrapper absolute"
          style={{
            top: p.top,
            left: p.left,
          }}
        >
          <div
            ref={el => particlesRef.current[i] = el}
            className={`particle will-change-transform ${
              p.shape === 'diamond' ? 'rotate-45' : ''
            }`}
            style={{
              width: p.shape === 'diamond' ? p.size * 0.7 : p.size,
              height: p.shape === 'diamond' ? p.size * 0.7 : p.size,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'diamond' ? '2px' : '50%',
              opacity: p.opacity,
              transform: `scale(${p.scale})`,
            }}
          ></div>
        </div>
      ))}
    </div>
  );
}
