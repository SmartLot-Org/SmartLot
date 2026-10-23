// Retry-After admite segundos o una fecha HTTP. El aviso nunca reemplaza el limite del servidor.
export function recoveryRetrySeconds(response, now = Date.now()) {
  const value = response?.headers?.['retry-after'];
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Math.max(1, Number(value));
  if (value) {
    const date = Date.parse(value);
    if (Number.isFinite(date)) return Math.max(1, Math.ceil((date - now) / 1000));
  }
  const seconds = Number(response?.data?.retry_after);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 60;
}
