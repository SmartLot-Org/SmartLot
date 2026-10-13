import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { LayoutGrid, Cpu, Smartphone, ShieldCheck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  { 
    title: "Tecnología de Asignación", 
    icon: <Cpu className="w-6 h-6" aria-hidden="true" />, 
    desc: "Optimización dinámica que aprende de los flujos de tu empresa para maximizar la ocupación.", 
    size: "md:col-span-2 md:row-span-2",
    iconBg: "bg-brand-blue/10 text-brand-blue",
    badge: "Core",
    badgeStyle: "border-brand-navy/15 text-brand-navy bg-white/90"
  },
  { 
    title: "Dashboard Analítico", 
    icon: <LayoutGrid className="w-6 h-6" aria-hidden="true" />, 
    desc: "Métricas en tiempo real, reportes de uso y gestión de usuarios en un solo lugar.", 
    size: "md:col-span-2 md:row-span-1",
    iconBg: "bg-brand-blue/10 text-brand-blue",
    badge: "Admin",
    badgeStyle: "border-brand-navy/10 text-brand-navy bg-white/90"
  },
  { 
    title: "Acceso Móvil", 
    icon: <Smartphone className="w-6 h-6" aria-hidden="true" />, 
    desc: "Entrada ágil y sin contacto desde el celular.", 
    size: "md:col-span-1 md:row-span-1",
    iconBg: "bg-brand-blue/10 text-brand-blue",
    badge: null,
    badgeStyle: ""
  },
  { 
    title: "Seguridad", 
    icon: <ShieldCheck className="w-6 h-6" aria-hidden="true" />, 
    desc: "Control estricto de patentes y permisos.", 
    size: "md:col-span-1 md:row-span-1",
    iconBg: "bg-brand-blue/10 text-brand-blue",
    badge: null,
    badgeStyle: ""
  }
];

export default function BentoGrid() {
  const container = useRef();

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: "top 75%", 
        }
      });

      tl.fromTo(".bento-header-text", 
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power4.out" }
      )
      .fromTo(".bento-card", 
        { y: 60, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.1, duration: 1.2, ease: "expo.out" }, 
        "-=0.6"
      );
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set([".bento-header-text", ".bento-card"], { opacity: 1, y: 0, scale: 1 });
    });

  }, { scope: container });

  return (
    <section id="solucion" ref={container} className="relative z-10 pt-16 pb-8 bg-transparent content-visibility-auto">
      <div className="max-w-6xl mx-auto px-6">
        
        <div className="mb-12 text-center relative z-20 flex flex-col items-center">
          <h2 className="bento-header-text text-brand-warm mb-6">
            Todo el control en un <br className="hidden md:block" /> solo lugar.
          </h2>
          <p className="bento-header-text text-brand-muted max-w-2xl mx-auto">
            Una plataforma diseñada para eliminar el caos y modernizar la gestión de tus espacios, sin complicaciones de hardware.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[260px]">
          {features.map((f, i) => (
            <div 
              key={i} 
              className={`
                bento-card group relative ${f.size} 
                overflow-hidden glass-card
                p-6 rounded-[1.5rem] flex flex-col justify-between text-left
                hover:shadow-[0_16px_40px_rgba(12,30,63,0.08)] 
                transition-all duration-500 hover:-translate-y-1
              `}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              <div className="flex justify-between items-start relative z-10">
                <div className={`w-14 h-14 ${f.iconBg} rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-2 shadow-sm`}>
                  {f.icon}
                </div>
                {f.badge && (
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${f.badgeStyle} shadow-sm`}>
                    {f.badge}
                  </span>
                )}
              </div>

              <div className="relative z-10 mt-6">
                <h3 className="text-[1.25rem] font-bold text-brand-warm mb-1 tracking-tight leading-snug">
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed text-brand-muted">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
