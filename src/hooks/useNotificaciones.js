import { useCallback, useEffect, useState } from "react";
import { NotificacionesGetAll, NotificacionesGetNoLeidas, NotificacionesMarcarLeida, NotificacionesMarcarTodasLeidas, NotificacionesEliminar } from "../servicies/API_Notificacion";
import { SolicitudesAutorizarModificacion, SolicitudesRechazarModificacion } from "../servicies/API_SolicitudEmpresaGarage";
import { normalizeList } from "../helpers/tratos";

const POLL_INTERVAL_MS = 30 * 1000;

let sharedPromise = null;
const refreshListeners = new Set();

export function notifyNotificacionesChanged() {
  sharedPromise = null;
  refreshListeners.forEach((listener) => listener());
}

function fetchNotificaciones() {
  if (!sharedPromise) {
    sharedPromise = Promise.all([
      NotificacionesGetAll({ force: true }),
      NotificacionesGetNoLeidas({ force: true }),
    ])
      .then(([lista, conteo]) => {
        const notificaciones = lista.respuesta ? normalizeList(lista.datos) : [];
        const raw = conteo.respuesta ? conteo.datos : 0;
        const noLeidas =
          typeof raw === "number"
            ? raw
            : Number(raw?.no_leidas ?? raw?.count ?? 0);
        return { notificaciones, noLeidas };
      })
      .finally(() => {
        sharedPromise = null;
      });
  }
  return sharedPromise;
}

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const value = await fetchNotificaciones();
    setNotificaciones(value.notificaciones);
    setNoLeidas(value.noLeidas);
    setLoading(false);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(refresh);
    refreshListeners.add(refresh);

    const interval = setInterval(() => {
      fetchNotificaciones().then((value) => {
        setNotificaciones(value.notificaciones);
        setNoLeidas(value.noLeidas);
      });
    }, POLL_INTERVAL_MS);

    return () => {
      cancelAnimationFrame(frame);
      clearInterval(interval);
      refreshListeners.delete(refresh);
    };
  }, [refresh]);

  const marcarLeida = useCallback(async (id) => {
    const response = await NotificacionesMarcarLeida(id);
    if (response.respuesta) {
      setNotificaciones((prev) =>
        prev.map((item) => (item.id === id ? { ...item, leida: true } : item))
      );
      setNoLeidas((prev) => Math.max(0, prev - 1));
    }
    return response;
  }, []);

  const marcarTodasLeidas = useCallback(async () => {
    const response = await NotificacionesMarcarTodasLeidas();
    if (response.respuesta) {
      setNotificaciones((prev) => prev.map((item) => ({ ...item, leida: true })));
      setNoLeidas(0);
    }
    return response;
  }, []);

  const eliminar = useCallback(async (id) => {
    const response = await NotificacionesEliminar(id);
    if (response.respuesta) {
      const target = notificaciones.find((item) => item.id === id);
      setNotificaciones((prev) => prev.filter((item) => item.id !== id));
      if (target && !target.leida) setNoLeidas((prev) => Math.max(0, prev - 1));
    }
    return response;
  }, [notificaciones]);

  const autorizarModificacion = useCallback(async (solicitudId, notificacionId) => {
    const response = await SolicitudesAutorizarModificacion(solicitudId);
    if (response.respuesta) {
      if (notificacionId) {
        setNotificaciones((prev) => prev.filter((item) => item.id !== notificacionId));
        setNoLeidas((prev) => Math.max(0, prev - 1));
      }
      notifyNotificacionesChanged();
    }
    return response;
  }, []);

  const rechazarModificacion = useCallback(async (solicitudId, notificacionId) => {
    const response = await SolicitudesRechazarModificacion(solicitudId);
    if (response.respuesta) {
      if (notificacionId) {
        setNotificaciones((prev) => prev.filter((item) => item.id !== notificacionId));
        setNoLeidas((prev) => Math.max(0, prev - 1));
      }
      notifyNotificacionesChanged();
    }
    return response;
  }, []);

  return {
    notificaciones,
    noLeidas,
    count: noLeidas,
    loading,
    refresh,
    marcarLeida,
    marcarTodasLeidas,
    eliminar,
    autorizarModificacion,
    rechazarModificacion,
  };
}
