import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAuth } from '../../contexts/useAuth';
import { showToast } from '../../helpers/toast';

export default function Navbar() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const navRef = useRef();

  const handleLoginClick = (e) => {
    if (usuario) {
      e.preventDefault();
      showToast('Ya tenés una sesión activa. Redirigiendo a tu panel…', 'info');
      const rutas = {
        1: '/admin_dashboard',
        2: '/empleados_dashboard',
        3: '/garagista_dashboard',
        4: '/superadmin_dashboard',
        5: '/duenio-garage/dashboard',
      };
      const ruta = rutas[Number(usuario.id_rol)] || '/';
      setTimeout(() => navigate(ruta), 1500);
    }
  };

  useGSAP(() => {
    let mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(navRef.current, {
        yPercent: -100,
        autoAlpha: 0,
        duration: 1.2,
        ease: "power4.out",
        delay: 0.3
      });
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(navRef.current, { autoAlpha: 1 });
    });
  });

  return (
    <header
      ref={navRef}
      className="fixed top-0 left-0 w-full z-50 glass-nav"
    >
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex justify-between items-center">

        <Link to="/" className="flex items-center gap-2 group">
          <img
            src="/logo.png"
            alt="SmartLot Logo"
            className="h-10 md:h-12 w-auto drop-shadow-sm transition-all duration-300 group-hover:brightness-110"
          />
          <span className="text-xl md:text-2xl font-extrabold text-brand-warm tracking-tight font-display">
            SmartLot
          </span>
        </Link>

        <Link
          to="/login"
          onClick={handleLoginClick}
          className="px-4 py-2 bg-brand-blue text-white rounded-lg font-semibold text-sm hover:bg-brand-deep active:scale-[0.97] transition-all duration-300 shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
        >
          Iniciar Sesión
        </Link>

      </div>
    </header>
  );
}
