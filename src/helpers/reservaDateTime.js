export const RESERVA_TIME_ZONE = 'America/Argentina/Buenos_Aires';

const instantFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: RESERVA_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

export function parseCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? value : null;
}

export function parseReservaHora(value) {
  if (typeof value !== 'string') return null;
  return /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?$/.test(value.trim()) ? value.trim().slice(0, 5) : null;
}

function instantParts(date) {
  const parts = Object.fromEntries(instantFormatter.formatToParts(date).map(({ type, value }) => [type, value]));
  return { fecha: `${parts.year}-${parts.month}-${parts.day}`, hora: `${parts.hour}:${parts.minute}`, segundo: parts.second };
}

export function parseReservaTimestamp(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim().replace(' ', 'T');
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2})(\.\d{1,6})?)?(Z|[+-]\d{2}:?\d{2})?$/i.exec(text);
  if (!match || !parseCalendarDate(match[1]) || !parseReservaHora(match[2]) || Number(match[3] ?? 0) > 59) return null;
  if (match[5]) {
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return null;
    const parts = instantParts(date);
    return { ...parts, local: `${parts.fecha}T${parts.hora}:${parts.segundo}`, instant: date };
  }
  return { fecha: match[1], hora: match[2], segundo: match[3] ?? '00',
    local: `${match[1]}T${match[2]}:${match[3] ?? '00'}${match[4] ?? ''}`, instant: null };
}

function firstValid(reserva, keys, parser) {
  const sources = [reserva, reserva?.reserva, reserva?.datos, reserva?.data, reserva?._doc, reserva?.dataValues];
  for (const source of sources) {
    for (const key of keys) {
      const entry = Object.entries(source ?? {}).find(([name]) => name.toLowerCase() === key.toLowerCase());
      const value = parser(entry?.[1]);
      if (value != null) return value;
    }
  }
  return null;
}

export function normalizeReservaDateTime(reserva = {}) {
  const start = firstValid(reserva, ['fecha_entrada', 'fechaEntrada', 'fecha_inicio', 'fechaInicio'], parseReservaTimestamp);
  const end = firstValid(reserva, ['fecha_salida', 'fechaSalida', 'fecha_finalizacion', 'fechaFinalizacion', 'fecha_fin', 'fechaFin'], parseReservaTimestamp);
  const fecha = firstValid(reserva, ['fecha', 'fecha_reserva', 'fechaReserva'], parseCalendarDate) ?? start?.fecha ?? end?.fecha ?? null;
  const entrada = firstValid(reserva, ['hora_entrada', 'horaEntrada', 'hora_inicio', 'horaInicio'], parseReservaHora) ?? start?.hora ?? null;
  const salida = firstValid(reserva, ['hora_salida', 'horaSalida', 'hora_fin', 'horaFin'], parseReservaHora) ?? end?.hora ?? null;
  const endDate = end?.fecha ?? fecha;
  return {
    fecha, hora_entrada: entrada, hora_salida: salida,
    fecha_entrada: fecha && entrada ? (start?.fecha === fecha && start.hora === entrada ? start.local : `${fecha}T${entrada}:00`) : null,
    fecha_salida: endDate && salida ? (end?.hora === salida ? end.local : `${endDate}T${salida}:00`) : null,
  };
}

export function formatReservaDate(value) {
  const fecha = parseCalendarDate(value);
  if (!fecha) return 'Fecha no disponible';
  const [year, month, day] = fecha.split('-');
  return `${day}/${month}/${year}`;
}

export function formatReservaMonth(value) {
  const fecha = parseCalendarDate(value);
  return fecha ? new Intl.DateTimeFormat('es-AR', { month: 'long', timeZone: 'UTC' }).format(new Date(`${fecha}T12:00:00+00:00`)) : 'Mes';
}

export function formatReservaHorario(reserva) {
  const time = normalizeReservaDateTime(reserva);
  return time.hora_entrada && time.hora_salida ? `${time.hora_entrada} a ${time.hora_salida}` : 'Horario no disponible';
}

// Convierte una hora calendario argentina a un instante usando IANA, sin un
// offset fijo y sin depender de la zona del navegador. Sólo para comparaciones.
export function toReservaInstant(value) {
  const parsed = parseReservaTimestamp(value);
  if (!parsed) return null;
  if (parsed.instant) return parsed.instant;
  const target = Date.parse(`${parsed.fecha}T${parsed.hora}:${parsed.segundo}+00:00`);
  let time = target;
  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = instantParts(new Date(time));
    const rendered = Date.parse(`${parts.fecha}T${parts.hora}:${parts.segundo}+00:00`);
    const difference = target - rendered;
    time += difference;
    if (!difference) return new Date(time);
  }
  return null;
}

export function mergeReservaEdit(original, response, edited) {
  const merged = { ...original, ...response, ...edited };
  // El DTO anterior puede tener horas derivadas: renovarlas antes de normalizar.
  const start = parseReservaTimestamp(edited.fecha_entrada);
  const end = parseReservaTimestamp(edited.fecha_salida);
  return { ...merged, ...normalizeReservaDateTime({ ...merged, fecha: start?.fecha,
    hora_entrada: start?.hora, hora_salida: end?.hora }) };
}
