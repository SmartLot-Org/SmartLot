import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../contexts/useAuth';
import { getUserHomeRoute } from '../helpers/roles';

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
        navigate(getUserHomeRoute(usuario), { replace: true });
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Error al iniciar sesión con Google.';
        console.error('[AuthCallback]', msg);
        navigate('/login', { replace: true, state: { error: msg } });
      });
  }, [navigate, setUsuario]);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-4">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent"
          aria-hidden="true"
        />
        <p className="text-brand-muted text-lg">Iniciando sesión...</p>
      </div>
    </div>
  );
}
