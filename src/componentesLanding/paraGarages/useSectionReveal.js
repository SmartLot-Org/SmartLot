import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export default function useSectionReveal(container) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: container.current,
            start: "top 75%",
          },
        });

        tl.fromTo(
          ".pg-header",
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power4.out" }
        ).fromTo(
          ".pg-item",
          { y: 56, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 1.1, ease: "expo.out" },
          "-=0.6"
        );
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set([".pg-header", ".pg-item"], { opacity: 1, y: 0, scale: 1 });
      });

      return () => mm.revert();
    },
    { scope: container }
  );
}
