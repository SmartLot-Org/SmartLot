import { useCallback, useEffect, useState } from "react";
import { SolicitudesGetRecibidas } from "../servicies/API_SolicitudEmpresaGarage";
import { normalizeList } from "../helpers/tratos";

let sharedPending = null;
const refreshListeners = new Set();

export function notifySolicitudesChanged() {
  sharedPending = null;
  refreshListeners.forEach((listener) => listener());
}

function fetchPendientesCount() {
  if (!sharedPending) {
    sharedPending = SolicitudesGetRecibidas({ force: true })
      .then((response) => {
        if (!response.respuesta) return 0;
        return normalizeList(response.datos).filter(
          (solicitud) => solicitud.estado === "pendiente"
        ).length;
      })
      .finally(() => {
        sharedPending = null;
      });
  }
  return sharedPending;
}

export function useSolicitudesPendientesCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const value = await fetchPendientesCount();
    setCount(value);
    setLoading(false);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(refresh);
    refreshListeners.add(refresh);
    return () => {
      cancelAnimationFrame(frame);
      refreshListeners.delete(refresh);
    };
  }, [refresh]);

  return { count, loading, refresh };
}