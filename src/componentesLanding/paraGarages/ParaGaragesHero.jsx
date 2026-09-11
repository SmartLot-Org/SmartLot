import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import GarageMapVisual from "./GarageMapVisual";

gsap.registerPlugin(ScrollTrigger);

export default function ParaGaragesHero() {
  const ref = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const intro = gsap.timeline({
          defaults: { ease: "power4.out" },
        });

        intro
          .from(".word", {
            yPercent: 110,
            duration: 1.15,
            stagger: 0.16,
          })
          .from(
            ".hero-pin",
            { opacity: 0, scale: 0.6, duration: 0.7, stagger: 0.08, ease: "back.out(1.6)" },
            "-=0.55"
          );

        const exit = gsap.timeline({
          // Sin overwrite: con scrub los tweens superpuestos sobre las mismas
          // líneas deben seguir vivos para que al volver arriba el reverse
          // restaure el estado inicial. Con "auto" el segundo tween mataba al
          // primero y el texto quedaba congelado a mitad de transición.
          defaults: { ease: "none", overwrite: false },
          scrollTrigger: {
            trigger: ref.current,
            start: "top top",
            end: "+=125%",
            pin: true,
            scrub: 0.75,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        exit
          .to(".hero-line-1", { xPercent: -6, yPercent: -12, rotate: -2 }, 0)
          .to(".hero-line-2", { xPercent: 8, yPercent: -8, rotate: 2 }, 0)
          .to(".hero-line-3", { xPercent: -4, yPercent: 10, rotate: 1.5 }, 0)
          .to(
            ".hero-line-1",
            {
              xPercent: -18,
              y: () => -window.innerHeight * 0.58,
              rotate: -9,
              opacity: 0,
              ease: "power2.in",
            },
            0.38
          )
          .to(
            ".hero-line-2",
            {
              xPercent: 22,
              y: () => -window.innerHeight * 0.42,
              rotate: 8,
              opacity: 0,
              ease: "power2.in",
            },
            0.42
          )
          .to(
            ".hero-line-3",
            {
              xPercent: -14,
              y: () => window.innerHeight * 0.48,
              rotate: 5,
              opacity: 0,
              ease: "power2.in",
            },
            0.46
          )
          .to(
            ".hero-map",
            { opacity: 0, scale: 1.1, ease: "none" },
            0.32
          );
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set([".hero-map", ".word", ".hero-pin", ".hero-line"], {
          opacity: 1,
          yPercent: 0,
          xPercent: 0,
          y: 0,
          x: 0,
          scale: 1,
          rotate: 0,
        });
      });

      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <section
      ref={ref}
      className="garage-hero relative z-10 min-h-[100svh] overflow-hidden bg-transparent"
    >
      <GarageMapVisual />

      <div className="relative z-10 flex min-h-[100svh] items-end px-5 pb-10 pt-28 sm:px-8 md:items-center md:px-12 md:pb-0 lg:px-16">
        <h1
          className="garage-hero-title w-full max-w-none text-brand-warm"
          aria-label="Aparecé en el mapa de las empresas"
        >
          <span aria-hidden="true" className="hero-line hero-line-1 block will-change-transform">
            <span className="block overflow-hidden py-[0.04em]">
              <span className="word block">APARECÉ</span>
            </span>
          </span>
          <span aria-hidden="true" className="hero-line hero-line-2 block will-change-transform md:text-right">
            <span className="block overflow-hidden py-[0.04em]">
              <span className="word block">EN EL MAPA</span>
            </span>
          </span>
          <span aria-hidden="true" className="hero-line hero-line-3 block will-change-transform">
            <span className="block overflow-hidden py-[0.04em]">
              <span className="word block text-brand-blue">DE LAS EMPRESAS</span>
            </span>
          </span>
        </h1>
      </div>
    </section>
  );
}
