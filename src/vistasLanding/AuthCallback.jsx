import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../contexts/useAuth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUsuario } = useAuth();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (!accessToken) {
      navigate('/login', { replace: true });
      return;
    }

    apiClient
      .post('/api/auth/google/callback', { access_token: accessToken }, { _skipAuthRedirect: true })
      .then((res) => {
        const usuario = res.data.usuario;
        setUsuario(usuario);
        if (!usuario) {
          navigate('/login', { replace: true, state: { error: 'No se recibieron datos del usuario.' } });
          return;
        }
        const rutas = {
          1: '/admin_dashboard',
          2: '/empleados_dashboard',
          3: '/garagista_dashboard',
          4: '/superadmin_dashboard',
          5: '/duenio-garage/dashboard',
        };
        navigate(rutas[Number(usuario.id_rol)] || '/', { replace: true });
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Error al iniciar sesión con Google.';
        console.error('[AuthCallback]', msg);
        navigate('/login', { replace: true, state: { error: msg } });
      });
  }, [navigate, setUsuario]);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <p className="text-brand-muted text-lg">Iniciando sesión...</p>
    </div>
  );
}
