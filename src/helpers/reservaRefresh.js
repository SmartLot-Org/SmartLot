export function reservationList(payload) {
  const list = Array.isArray(payload) ? payload
    : payload?.datos ?? payload?.data ?? payload?.reservas ?? payload?.value;
  if (!Array.isArray(list) || list.some((row) => !row || typeof row !== 'object')) {
    throw new Error('Formato de reservas inválido.');
  }
  return list;
}

export function createReservaRefresh({ fetchReservations, onData, onError, onSettled = () => {} }) {
  let active = true;
  let generation = 0;
  let pending = null;
  let controller = null;
  const invalidate = () => {
    generation += 1;
    controller?.abort();
    pending = null;
  };
  return {
    refresh(reason = 'refresh') {
      if (!active) return Promise.resolve();
      if (pending) return pending;
      const version = generation;
      controller = new AbortController();
      const signal = controller.signal;
      const request = Promise.resolve().then(() => fetchReservations({ force: true, signal }))
        .then((response) => {
          if (!active || signal.aborted || version !== generation) return;
          if (!response?.respuesta) throw new Error('No se pudieron actualizar tus reservas.');
          onData(reservationList(response.datos), reason);
        })
        .catch((error) => {
          if (active && !signal.aborted && version === generation) onError(error);
        })
        .finally(() => {
          if (pending === request) pending = null;
          if (active && !signal.aborted && version === generation) onSettled();
        });
      pending = request;
      return request;
    },
    invalidate,
    dispose() { active = false; invalidate(); },
  };
}

export function bindReservaPolling(refresh, windowTarget, documentTarget, timerHost = windowTarget) {
  const focus = () => { void refresh('focus'); };
  const visible = () => {
    if (documentTarget.visibilityState === 'visible') void refresh('visibilitychange');
  };
  const interval = timerHost.setInterval(() => { void refresh('interval'); }, 15_000);
  windowTarget.addEventListener('focus', focus);
  documentTarget.addEventListener('visibilitychange', visible);
  return () => {
    timerHost.clearInterval(interval);
    windowTarget.removeEventListener('focus', focus);
    documentTarget.removeEventListener('visibilitychange', visible);
  };
}
