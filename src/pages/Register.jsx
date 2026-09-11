import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useAuth } from "../contexts/useAuth";
import { getUserHomeRoute } from "../helpers/roles";
import RegisterRoleToggle, { MODO_EMPRESA, MODO_GARAGE } from "../componentesLanding/auth/RegisterRoleToggle";
import RegisterEmpresaForm from "../componentesLanding/auth/RegisterEmpresaForm";
import RegisterGarageForm from "../componentesLanding/auth/RegisterGarageForm";
import RegisterBrandPanel from "../componentesLanding/auth/RegisterBrandPanel";
import "./Register.css";

gsap.registerPlugin(useGSAP);

export default function Register() {
  const { usuario } = useAuth();
  const [searchParams] = useSearchParams();
  const container = useRef(null);
  const formWrapRef = useRef(null);
  const modoInicial = searchParams.get("modo") === "garage" ? MODO_GARAGE : MODO_EMPRESA;
  const [modo, setModo] = useState(modoInicial);
  const [renderedModo, setRenderedModo] = useState(modoInicial);

  // En desktop fijamos la página al viewport para evitar scroll de página;
  // si el contenido excede la altura, el propio panel hace scroll interno.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const aplicar = () => {
      document.body.style.overflow = mq.matches ? "hidden" : "";
      document.body.style.height = mq.matches ? "100vh" : "";
    };
    aplicar();
    mq.addEventListener("change", aplicar);
    return () => {
      mq.removeEventListener("change", aplicar);
      document.body.style.overflow = "";
      document.body.style.height = "";
    };
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          container.current.querySelectorAll(".auth-stagger"),
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power2.out" }
        );
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(container.current.querySelectorAll(".auth-stagger"), { opacity: 1, y: 0 });
      });
      return () => mm.kill();
    },
    { scope: container }
  );

  const cambiarModo = (next) => {
    if (next === modo) return;
    setModo(next);

    const wrap = formWrapRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!wrap || reduce) {
      setRenderedModo(next);
      return;
    }

    const fromH = wrap.offsetHeight;
    gsap.killTweensOf(wrap);
    gsap.to(wrap, {
      autoAlpha: 0,
      x: -14,
      duration: 0.16,
      ease: "power2.in",
      onComplete: () => {
        setRenderedModo(next);
        requestAnimationFrame(() => {
          const target = formWrapRef.current;
          if (!target) return;
          const toH = target.offsetHeight;
          gsap.set(target, { overflow: "hidden" });
          gsap.fromTo(
            target,
            { height: fromH },
            {
              height: toH,
              duration: 0.3,
              ease: "power2.inOut",
              onComplete: () => gsap.set(target, { clearProps: "height,overflow" }),
            }
          );
          gsap.fromTo(
            target,
            { autoAlpha: 0, x: 14 },
            { autoAlpha: 1, x: 0, duration: 0.32, ease: "power2.out" }
          );
          gsap.fromTo(
            target.querySelectorAll(".auth-stagger"),
            { y: 12, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.4, stagger: 0.045, ease: "power2.out", delay: 0.05 }
          );
        });
      },
    });
  };

  if (usuario) return <Navigate to={getUserHomeRoute(usuario)} replace />;

  return (
    <div ref={container} className="register-page min-h-screen md:h-screen bg-white relative flex flex-col md:flex-row md:overflow-hidden">
      <div className="register-form-pane w-full md:w-1/2 min-h-screen md:h-screen md:overflow-y-auto flex flex-col p-6 sm:p-12 relative z-10 bg-white">
        <div className="m-auto w-full max-w-md py-8">
          <Link
            to="/"
            className="auth-stagger inline-flex items-center gap-1.5 text-sm font-semibold text-brand-muted hover:text-brand-blue transition-colors mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Volver al inicio
          </Link>

          <h1 className="auth-stagger text-3xl md:text-4xl font-extrabold text-brand-warm mb-4 font-display">
            Creá tu cuenta
          </h1>

          <RegisterRoleToggle modo={modo} onChange={cambiarModo} />

          {modo === MODO_EMPRESA && (
            <div className="auth-stagger flex gap-2.5 rounded-xl border border-brand-blue/20 bg-brand-blue/5 p-3 mt-4">
              <Building2 size={18} className="text-brand-blue shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-brand-muted leading-relaxed">
                Tu registro debe ser <strong className="text-brand-warm">aprobado</strong> antes de que se pueda
                crear tu usuario con tu empresa. Luego, desde tu dashboard vas a poder{" "}
                <strong className="text-brand-warm">crear tus sedes</strong>.
              </p>
            </div>
          )}

          <div ref={formWrapRef} className="mt-4">
            {renderedModo === MODO_EMPRESA ? (
              <RegisterEmpresaForm key="empresa" />
            ) : (
              <RegisterGarageForm key="garage" />
            )}
          </div>

          <p
            className="auth-stagger text-center text-sm text-brand-muted"
            style={{ marginTop: "1rem" }}
          >
            ¿Ya tenés cuenta?{" "}
            <Link to="/login" className="font-semibold text-brand-blue hover:underline">
              Ingresá
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden md:block w-full md:w-1/2 md:h-screen relative z-0">
        <RegisterBrandPanel modo={modo} />
      </div>
    </div>
  );
}
