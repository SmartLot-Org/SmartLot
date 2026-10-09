import axios from 'axios';

// El backend en Render (plan free) se apaga tras ~15 min sin tráfico: el primer
// request queda esperando el arranque del contenedor más de lo que dura el
// timeout por defecto del cliente. Durante el arranque no hay respuesta (timeout
// o error de red), así que esos fallos son reintentables en pedidos idempotentes.
const TIMEOUT_ARRANQUE_MS = 45000;
const ESPERA_REINTENTO_MS = 3000;
const ESTADOS_REINTENTABLES = new Set([502, 503, 504]);

function esErrorDeArranque(error) {
  if (!error || axios.isCancel(error) || error.code === 'ERR_CANCELED') return false;
  if (!error.response) return true;
  return ESTADOS_REINTENTABLES.has(error.response.status);
}

async function conReintentoDeArranque(pedido, { intentos = 2, esperaMs = ESPERA_REINTENTO_MS } = {}) {
  let ultimoError;

  for (let intento = 1; intento <= intentos; intento += 1) {
    try {
      return await pedido(intento);
    } catch (error) {
      ultimoError = error;
      if (intento === intentos || !esErrorDeArranque(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, esperaMs));
    }
  }

  throw ultimoError;
}

export { TIMEOUT_ARRANQUE_MS, esErrorDeArranque, conReintentoDeArranque };
