import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../helpers/toast';
import { useAuth } from '../contexts/useAuth';

export default function ProtectedRoute({ allowedRoles, children, usuario }) {
  const navigate = useNavigate();
  const { roleTransition } = useAuth();
  const toastShown = useRef(false);
  const userRole = Number(usuario?.id_rol);

  useEffect(() => {
    if (!usuario) {
      navigate('/login', { replace: true });
      return;
    }
    if (!allowedRoles.includes(userRole)) {
      if (!roleTransition && !toastShown.current) {
        showToast('No tenés permisos para acceder a esta URL con tu rol.', 'warning');
        toastShown.current = true;
      }
      const rutas = {
        1: '/admin_dashboard',
        2: '/empleados_dashboard',
        3: '/garagista_dashboard',
        4: '/superadmin_dashboard',
        5: '/duenio-garage/dashboard',
      };
      const ruta = rutas[userRole] || '/';
      navigate(ruta, { replace: true });
    }
  }, [usuario, allowedRoles, navigate, userRole, roleTransition]);

  if (!usuario) return null;
  if (!allowedRoles.includes(userRole)) return null;
  return children;
}
