import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { AuthContext } from './authContext';
import { haySuperadminBackup, obtenerUsuarioImpersonado, eliminarUsuarioImpersonado, eliminarSuperadminBackup } from '../helpers/superadminSession';

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
    const timeout = setTimeout(() => controller.abort(), 10000);

    apiClient.get('/api/usuario/me', { _skipAuthRedirect: true, signal: controller.signal })
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
        clearTimeout(timeout);
        if (!cancelado) setLoading(false);
      });

    return () => { cancelado = true; controller.abort(); clearTimeout(timeout); };
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, loading, setUsuario, roleTransition, setRoleTransition }}>
      {children}
    </AuthContext.Provider>
  );
}

