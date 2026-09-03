import { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import apiClient from "../../api/client";
import { getUserHomeRoute } from "../../helpers/roles";
import "./LoginForm.css";   

gsap.registerPlugin(useGSAP);

export default function LoginForm() {
  const location = useLocation();
  const pathRef = useRef();
  const buttonRef = useRef();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => location.state?.error || "");
  const [cooldown, setCooldown] = useState(0);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  useEffect(() => {
    if (location.state?.error) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  useGSAP(() => {
    if (!pathRef.current) return;
    gsap.to(pathRef.current, {
      strokeDashoffset: -150,
      duration: 4.5,
      ease: "none",
      repeat: -1,
    });
  }, { scope: buttonRef });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("El email es requerido.");
      return;
    }
    if (cooldown > 0) {
      setError(`Espere ${cooldown}s antes de reintentar.`);
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post(
        "/api/usuario/login",
        {
          email: email.trim(),
          contraseña: password,
        },
        { _skipAuthRedirect: true }
      );

      const usuario = res.data?.usuario;
      const rutaDestino = getUserHomeRoute(usuario);
      window.location.href = rutaDestino;
    } catch (err) {
      const msg = err.response?.data?.message || "Error de conexión.";
      setError(msg);

      if (err.response?.status === 429) {
        const retryAfter = parseInt(err.response?.headers?.["retry-after"] || "900", 10);
        setCooldown(retryAfter);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setGoogleError("");
    try {
      const res = await apiClient.get("/api/auth/google", { _skipAuthRedirect: true });
      window.location.href = res.data.url;
    } catch (error) {
      setGoogleError(error.response?.data?.message || "Hubo un error al conectar con Google.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
   
      <h1 className=" h1Smartlot auth-stagger text-3xl md:text-4xl font-extrabold text-brand-warm mb-0 font-display">
        Iniciar Sesión
      </h1>
      
      <p className=" pIngrese auth-stagger text-brand-muted text-sm md:text-base mb-2 leading-relaxed">
        Ingresá a tu panel de gestión
      </p>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="auth-stagger relative">
          <input
            type="email"
            id="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder=" "
            className="peer w-full px-5 pt-6 pb-2.5 bg-brand-surface/70 border border-brand-deep/10 rounded-xl text-brand-warm text-base outline-none transition-all duration-300 ease-out focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
          />
          <label
            htmlFor="email"
            className="font-body absolute left-5 top-4 text-brand-muted text-base pointer-events-none transition-all duration-300 ease-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-brand-muted peer-focus:top-2 peer-focus:text-xs peer-focus:text-brand-blue peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-brand-muted"
          >
            Correo electrónico
          </label>
        </div>

        <div className="auth-stagger relative">
          <input
            type="password"
            id="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder=" "
            className="peer w-full px-5 pt-6 pb-2.5 bg-brand-surface/70 border border-brand-deep/10 rounded-xl text-brand-warm text-base outline-none transition-all duration-300 ease-out focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
          />
          <label
            htmlFor="password"
            className="font-body absolute left-5 top-4 text-brand-muted text-base pointer-events-none transition-all duration-300 ease-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-brand-muted peer-focus:top-2 peer-focus:text-xs peer-focus:text-brand-blue peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-brand-muted"
          >
            Contraseña
          </label>
        </div>

        <p className="text-right text-sm text-brand-muted mt-1">
          <a href="/recuperar-clave" className="hover:underline">¿Olvidaste tu contraseña?</a>
        </p>

        <button
          ref={buttonRef}
          type="submit"
          disabled={loading || cooldown > 0}
          className="auth-stagger group relative w-full mt-2 rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <rect
              fill="none"
              stroke="url(#btn-beam-glow)"
              strokeWidth="12"
              rx="5"
              strokeDasharray="30 120"
              strokeDashoffset="150"
              opacity="0.6"
            />
            <rect
              ref={pathRef}
              x="0"
              y="0"
              width="100"
              height="100"
              rx="5"
              fill="none"
              stroke="url(#btn-beam)"
              strokeWidth="3"
              strokeDasharray="30 120"
              strokeDashoffset="150"
            />
            <defs>
              <linearGradient id="btn-beam" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2A5CBF" stopOpacity="0" />
                <stop offset="20%" stopColor="#2A5CBF" stopOpacity="0.3" />
                <stop offset="35%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="50%" stopColor="#6BA3E8" stopOpacity="0.9" />
                <stop offset="65%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="80%" stopColor="#2A5CBF" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0C1E3F" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="btn-beam-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2A5CBF" stopOpacity="0" />
                <stop offset="25%" stopColor="#2A5CBF" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#6BA3E8" stopOpacity="0.6" />
                <stop offset="75%" stopColor="#2A5CBF" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0C1E3F" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          <div className="relative m-[2px] rounded-[10px] bg-brand-blue px-8 py-4 text-white font-bold text-lg shadow-lg shadow-brand-blue/20 transition-all duration-300 group-hover:bg-brand-deep group-hover:shadow-brand-deep/25 group-active:scale-[0.97]">
            {cooldown > 0
              ? `Espere ${cooldown}s`
              : loading ? "Ingresando..." : "Ingresar"}
          </div>
        </button>
        
        {error && <p className="text-sm text-red-500 mt-2 text-center">{error}</p>}
      </form>

      <div className="auth-stagger relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-brand-deep/10" />
        </div>
        <div className="relative flex justify-center">
          <span className=" continualCon bg-white px-4 text-sm text-brand-muted">O continuá con</span>
        </div>
      </div>

      {googleError && <p className="text-sm text-red-500 mb-3 text-center">{googleError}</p>}

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="auth-stagger group relative w-full rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <div className="relative flex items-center justify-center gap-3 border border-brand-deep/10 bg-brand-surface/70 px-8 py-3.5 text-brand-warm font-semibold text-base rounded-xl transition-all duration-300 group-hover:bg-brand-surface group-hover:border-brand-deep/20 group-active:scale-[0.97]">
          <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.58z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.31 24 12 24z"/>
            <path fill="#FBBC05" d="M5.32 14.24c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31V6.48H1.21C.44 8.02 0 9.75 0 11.5s.44 3.48 1.21 5.02l4.11-3.28z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.31 0 3.18 2.12 1.21 5.63l4.11 3.28c.94-2.85 3.57-4.96 6.68-4.96z"/>
          </svg>
          {googleLoading ? "Conectando..." : "Google"}
        </div>
      </button>
    </div>
  );
}
