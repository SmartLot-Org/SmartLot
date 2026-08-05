import { useRef } from 'react';
import { Navigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import LoginForm from '../componentesLanding/auth/LoginForm';
import BrandPanel from '../componentesLanding/auth/BrandPanel';
import { useAuth } from '../contexts/useAuth';
import { getUserHomeRoute } from '../helpers/roles';

export default function Auth() {
  const { usuario } = useAuth();
  const container = useRef(null);

  useGSAP(() => {
    if (!container.current) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        container.current.querySelectorAll('.auth-stagger'),
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power2.out" }
      );
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(container.current.querySelectorAll('.auth-stagger'), { opacity: 1, y: 0 });
    });

    return () => mm.kill();
  }, { scope: container });

  if (usuario) {
    return <Navigate to={getUserHomeRoute(usuario)} replace />;
  }

  return (
    <div ref={container} className="min-h-screen bg-white relative flex flex-col md:flex-row overflow-hidden">
      <div className="w-full md:w-1/2 min-h-screen flex items-center justify-center p-6 sm:p-12 lg:p-16 relative z-10 bg-white">
        <LoginForm />
      </div>

      <div className="hidden md:block w-full md:w-1/2 min-h-screen relative z-0">
        <BrandPanel />
      </div>
    </div>
  );
}
