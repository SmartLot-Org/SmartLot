import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { showToast } from '../helpers/toast';
import { useAuth } from '../contexts/useAuth';
import { getUserHomeRoute, userHasRole } from '../helpers/roles';

export default function ProtectedRoute({ allowedRoles, children, usuario }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { roleTransition, loading } = useAuth();
  const toastShown = useRef(false);
  const autorizado = usuario ? userHasRole(usuario, ...allowedRoles) : false;

  useEffect(() => {
    if (loading) return;
    if (!usuario) {
      const destino = `${location.pathname}${location.search}`;
      navigate(`/login?redirect=${encodeURIComponent(destino)}`, { replace: true });
      return;
    }
    if (!autorizado) {
      if (!roleTransition && !toastShown.current) {
        showToast('No tenés permisos para acceder a esta URL con tu rol.', 'warning');
        toastShown.current = true;
      }
      navigate(getUserHomeRoute(usuario), { replace: true });
    }
  }, [usuario, loading, allowedRoles, navigate, autorizado, roleTransition, location.pathname, location.search]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
      </div>
    );
  }

  if (!usuario) return null;
  if (!autorizado) return null;
  return children;
}
