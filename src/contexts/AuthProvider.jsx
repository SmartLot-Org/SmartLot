import { useState, useEffect } from 'react';
import apiClient, { SESSION_EXPIRED_EVENT } from '../api/client';
import { AuthContext } from './authContext';
import { haySuperadminBackup, obtenerUsuarioImpersonado, eliminarUsuarioImpersonado, eliminarSuperadminBackup } from '../helpers/superadminSession';
import { TIMEOUT_ARRANQUE_MS, conReintentoDeArranque } from '../helpers/arranqueApi';

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleTransition, setRoleTransition] = useState(false);

  useEffect(() => {
    // Distingue la cancelación por desmontaje (StrictMode remonta el efecto)
    // de un fallo real de sesión: si se aborta por cleanup no hay que tocar
    // las cookies de impersonación ni el estado.
    let cancelado = false;
    const controller = new AbortController();

    // El backend free puede estar arrancando: timeout ampliado y un reintento
    // evitan marcar como deslogueado a un usuario con sesión válida.
    conReintentoDeArranque(() => apiClient.get('/api/usuario/me', {
      _skipAuthRedirect: true,
      signal: controller.signal,
      timeout: TIMEOUT_ARRANQUE_MS,
    }))
      .then((res) => {
        if (cancelado) return;
        const impersonado = obtenerUsuarioImpersonado();
        if (impersonado && haySuperadminBackup() && Number(impersonado.id) === Number(res.data.usuario?.id)) {
          setUsuario(impersonado);
        } else {
          setUsuario(res.data.usuario);
          eliminarUsuarioImpersonado();
          if (impersonado && haySuperadminBackup()) eliminarSuperadminBackup();
        }
      })
      .catch(() => {
        if (cancelado) return;
        setUsuario(null);
        eliminarUsuarioImpersonado();
        eliminarSuperadminBackup();
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => { cancelado = true; controller.abort(); };
  }, []);

  // Cuando el interceptor confirma que ni siquiera el refresh puede recuperar
  // la sesión, limpia el estado en memoria para no dejar un usuario stale.
  useEffect(() => {
    const onSessionExpired = () => {
      setUsuario(null);
      setRoleTransition(false);
      eliminarUsuarioImpersonado();
      eliminarSuperadminBackup();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, loading, setUsuario, roleTransition, setRoleTransition }}>
      {children}
    </AuthContext.Provider>
  );
}

