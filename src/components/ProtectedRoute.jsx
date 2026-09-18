import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { showToast } from '../helpers/toast';
import { useAuth } from '../contexts/useAuth';
import { getUserHomeRoute, userHasRole } from '../helpers/roles';

export default function ProtectedRoute({ allowedRoles, children, usuario }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { roleTransition } = useAuth();
  const toastShown = useRef(false);
  const autorizado = usuario ? userHasRole(usuario, ...allowedRoles) : false;

  useEffect(() => {
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
  }, [usuario, allowedRoles, navigate, autorizado, roleTransition, location.pathname, location.search]);

  if (!usuario) return null;
  if (!autorizado) return null;
  return children;
}
