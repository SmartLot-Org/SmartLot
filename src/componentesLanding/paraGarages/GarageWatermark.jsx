import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function GarageWatermark() {
  const container = useRef(null);
  const logoRef = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(logoRef.current, { opacity: 0.06, rotationY: 24 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(logoRef.current, { opacity: 0.06, rotationY: 0 });
        gsap.to(logoRef.current, {
          rotationY: 360,
          duration: 18,
          ease: "none",
          repeat: -1,
        });
      });

      return () => mm.revert();
    },
    { scope: container }
  );

  return (
    <div
      ref={container}
      className="garage-watermark pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 flex items-center justify-center [perspective:1200px]">
        <img
          ref={logoRef}
          src="/logo.png"
          alt=""
          width="1200"
          height="1200"
          className="h-auto w-[130vmin] max-w-[1600px] object-contain [transform-style:preserve-3d] will-change-transform"
        />
      </div>
    </div>
  );
}
