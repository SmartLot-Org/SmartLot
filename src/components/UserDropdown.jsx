// src/components/UserDropdown.jsx
import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import Swal from 'sweetalert2';
import { Z_INDEX } from '../helpers/zIndex';
import { LogOut, User, ChevronDown, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { obtenerSuperadminBackup, eliminarSuperadminBackup, eliminarUsuarioImpersonado } from '../helpers/superadminSession';
import { clearCache } from '../cache/cacheStore';
import apiClient from '../api/client';
import { getUserProfileRoute, getUserRoleLabel } from '../helpers/roles';

const AVATAR_GRADIENTS = [
  'from-brand-blue to-brand-sky',
  'from-brand-deep to-brand-blue',
  'from-brand-navy to-brand-sky',
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function getAvatarGradient(name) {
  if (!name) return AVATAR_GRADIENTS[0];
  return AVATAR_GRADIENTS[Math.abs(hashString(name)) % AVATAR_GRADIENTS.length];
}

function getInitial(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

export default function UserDropdown() {
  const { usuario, setUsuario, setRoleTransition } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  const fullName = usuario
    ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim()
    : '';
  const displayName = fullName || usuario?.email?.split('@')[0] || 'Usuario';
  const roleLabel = getUserRoleLabel(usuario);
  const initial = getInitial(displayName);
  const gradient = getAvatarGradient(displayName);

  useGSAP(() => {
    if (!panelRef.current) return;

    if (isOpen) {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, scale: 0.96, y: -8, transformOrigin: 'top right' },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.24,
          ease: 'power3.out',
        }
      );

      const items = panelRef.current.querySelectorAll('.dropdown-item');
      if (items.length) {
        gsap.fromTo(
          items,
          { opacity: 0, y: -6 },
          { opacity: 1, y: 0, duration: 0.2, stagger: 0.04, ease: 'power2.out' }
        );
      }
    }
  }, { dependencies: [isOpen], revertOnUpdate: true, scope: containerRef });

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNavegacionPerfil = useCallback(() => {
    setIsOpen(false);

    if (!usuario) {
      navigate('/login');
      return;
    }

    navigate(getUserProfileRoute(usuario));
  }, [navigate, usuario]);

  const handleLogout = useCallback(async () => {
    setIsOpen(false);

    const superadminBackup = obtenerSuperadminBackup();

    if (superadminBackup) {
      const response = await apiClient.post('/api/usuario/stop-impersonate');
      eliminarSuperadminBackup();
      eliminarUsuarioImpersonado();
      clearCache();
      setRoleTransition(true);
      setUsuario(response.data?.usuario || superadminBackup);
      navigate('/superadmin_dashboard', { replace: true });
      return;
    }

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'Cerrando sesion de forma segura...',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      zIndex: Z_INDEX.SWAL_DIALOG,
    });

    try {
      await apiClient.post('/api/usuario/logout');
    } catch {
      // Exit locally even if the server logout request fails.
    }

    setUsuario(null);
    navigate('/login', { replace: true });
  }, [navigate, setRoleTransition, setUsuario]);

  return (
    <div className="relative" ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        onClick={handleToggle}
        className={`group flex items-center gap-1.5 rounded-lg border px-1.5 py-1 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20 ${isOpen
          ? 'border-brand-blue/10 bg-brand-blue/5'
          : 'border-transparent hover:border-brand-blue/8 hover:bg-brand-blue/4'
          }`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Menu de usuario: ${displayName}`}
      >
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-[11px] font-bold text-white shadow-sm ring-1 ring-white/60`}
        >
          {initial}
        </div>

        <div className="hidden text-left md:block">
          <div className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-slate-500">
            <ShieldCheck size={9} />
            <span>{roleLabel}</span>
          </div>
        </div>

        <ChevronDown
          size={14}
          className={`hidden text-brand-muted transition-transform duration-200 group-hover:text-brand-blue md:block ${isOpen ? 'rotate-180 text-brand-blue' : ''
            }`}
        />
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          role="menu"
          className="absolute right-0 top-full z-[1100] mt-2 w-60 overflow-hidden rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(18px) saturate(1.35)',
            WebkitBackdropFilter: 'blur(18px) saturate(1.35)',
            border: '1px solid rgba(37, 99, 235, 0.08)',
            boxShadow:
              '0 18px 42px rgba(15, 23, 42, 0.14), 0 2px 6px rgba(37, 99, 235, 0.05)',
          }}
        >
          <div className="px-3 pb-2.5 pt-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-sm font-black text-white shadow-sm`}
              >
                {initial}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-black text-brand-warm">{displayName}</p>
                <p className="truncate text-[11px] text-brand-muted">{usuario?.email || ''}</p>
              </div>
            </div>

            <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-brand-blue/8 bg-brand-blue/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-brand-blue">
              <ShieldCheck size={11} />
              <span>{roleLabel}</span>
            </div>
          </div>

          <div className="mx-2.5 h-px bg-gradient-to-r from-transparent via-brand-blue/10 to-transparent" />

          <div className="p-1.5">
            <button
              role="menuitem"
              className="dropdown-item flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-brand-warm transition-colors duration-150 hover:bg-brand-blue/5"
              onClick={handleNavegacionPerfil}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-brand-muted">
                <User size={14} />
              </span>
              <span>Perfil</span>
            </button>

            <div className="mx-2.5 h-px bg-gradient-to-r from-transparent via-black/5 to-transparent" />

            <div className="p-1.5">
              <button
                role="menuitem"
                className="dropdown-item flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-bold text-rose-600 transition-colors duration-150 hover:bg-rose-50 hover:text-rose-700"
                onClick={handleLogout}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  <LogOut size={14} />
                </span>
                <span>Cerrar sesion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
