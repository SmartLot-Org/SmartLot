export function parseReservationLimit(limited, value) {
  if (!limited) return null;
  if (!/^\d+$/.test(String(value)) || Number(value) > 32767) {
    throw new Error('Ingresá un entero entre 0 y 32767.');
  }
  return Number(value);
}

export function reservationLimitLabel(limit) {
  if (limit == null) return 'Sin límite';
  if (limit === 0) return 'Nuevas reservas bloqueadas';
  return `Máximo: ${limit} reservas activas`;
}

export function reservationPolicyMessage(policy) {
  if (!policy) return '';
  if (policy.sinLimite) return `Reservas vigentes: ${policy.activas}. Sin límite.`;
  if (policy.limite === 0) return 'Tu empresa bloqueó temporalmente la creación de nuevas reservas.';
  return `Reservas vigentes: ${policy.activas} de ${policy.limite}. Te quedan ${policy.restantes} disponibles.`;
}

export function reservationLimitError(data) {
  if (data?.code !== 'RESERVATION_LIMIT_REACHED') return null;
  if (data.details?.limit === 0) return 'Tu empresa bloqueó temporalmente la creación de nuevas reservas.';
  return data.message || 'Alcanzaste el límite de reservas activas definido por tu empresa.';
}
