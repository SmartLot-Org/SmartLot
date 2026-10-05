import { reservationLimitError } from './reservationPolicy.js';

const patrones = [
  { patron: /\b(cerrad[ao]?|no\s*abre|no\s*opera|descanso|feriado|fin\s*de)\b/, texto: "Ese garage no est\u00e1 operativo el d\u00eda seleccionado. Revis\u00e1 los d\u00edas y horarios de atenci\u00f3n." },
  { patron: /\b(domingo|s[aá]bado|lunes|martes|mi[eé]rcoles|jueves|viernes)\b.*\b(cerrad[ao]?|no\s*abre|no\s*opera|descanso)\b/, texto: "Ese garage no abre los d\u00edas seleccionados. Revis\u00e1 el calendario de atenci\u00f3n." },
  { patron: /(sin.*disponibilidad|no.*hay.*espacio|garage.*lleno|sin.*lugares|sin.*vacante).*d[ií]a/, texto: "Ese garage ya no tiene lugares disponibles para el d\u00eda seleccionado. Prob\u00e1 con otra fecha." },
  { patron: /(sin.*disponibilidad|no.*hay.*espacio|cancelad|sin.*lugar|sin.*vacante)/, texto: "Ese garage no tiene m\u00e1s disponibilidad en este momento. Prob\u00e1 con otro horario o fecha." },
  { patron: /(capacidad.*completa|cupo.*completo|supera.*capacidad|aforo.*completo)/, texto: "Ese garage alcanz\u00f3 su capacidad m\u00e1xima para el d\u00eda seleccionado. Prob\u00e1 con otra fecha." },
  { patron: /(garage.*no.*disponible.*fecha|no.*disponible.*fecha|fecha.*sin.*disponibilidad|sin.*disponibilidad.*fecha)/, texto: "Ese garage no est\u00e1 disponible para la fecha seleccionada. Eleg\u00ed otra fecha." },
  { patron: /(horario.*no.*disponible|no.*disponible.*horario|sin.*disponibilidad.*horario|hora.*no.*disponible|fuera.*de.*horario)/, texto: "El garage no tiene disponibilidad en el horario solicitado. Prob\u00e1 con otro horario." },
  { patron: /(ya.*reserv|ya.*existe|ya.*tiene.*reserv|superpone|conflicto.*horario|traslapa)/, texto: "El veh\u00edculo ya tiene una reserva que se superpone con ese horario. Revis\u00e1 los horarios." },
  { patron: /(fecha.*inva[lí]lid|fecha.*pasada|fecha.*vencida|fecha.*incorrecta)/, texto: "La fecha seleccionada no es v\u00e1lida o ya pas\u00f3. Eleg\u00ed una fecha futura." },
  { patron: /(garage.*no.*encontrad|no.*existe.*garage|garage.*inva[lí]lid|garage.*inexistente)/, texto: "El garage seleccionado no fue encontrado. Posiblemente fue desactivado." },
  { patron: /(veh[ií]culo.*no.*encontrad|no.*existe.*veh[ií]culo|veh[ií]culo.*inva[lí]lid)/, texto: "El veh\u00edculo seleccionado no fue encontrado." },
  { patron: /(usuario.*no.*encontrad|no.*existe.*usuario|usuario.*inva[lí]lid)/, texto: "No se pudo identificar al usuario. Inici\u00e1 sesi\u00f3n nuevamente." },
  { patron: /(garage.*disponible|garage.*ocupad)/, texto: "El garage seleccionado no est\u00e1 disponible en este momento. Eleg\u00ed otro o intent\u00e1 de nuevo." },
];

function textoLimpio(texto) {
  return texto.replace(/\s+/g, " ").trim();
}

function mensajeAmigable(datosError, nombreGarage) {
  const limitError = reservationLimitError(datosError);
  if (limitError) return limitError;
  const raw = datosError?.message || datosError?.error || datosError?.mensaje || "";
  const msg = (Array.isArray(raw) ? raw.join(". ") : String(raw)).toLowerCase();
  const match = patrones.find((e) => e.patron.test(msg));

  if (match?.texto) {
    let texto = match.texto;
    if (nombreGarage) {
      texto = texto.replace("Ese garage", `"${nombreGarage}"`).replace("El garage", `"${nombreGarage}"`);
    }
    return texto;
  }

  const limpio = textoLimpio(msg);
  if (nombreGarage && limpio) return limpio.replace("garage", `"${nombreGarage}"`);
  return limpio || "Hubo un error al procesar la reserva. Intentalo de nuevo.";
}

function mensajeToast(raw) {
  const texto = Array.isArray(raw) ? raw.join(". ") : String(raw ?? "");
  const match = patrones.find((e) => e.patron.test(texto.toLowerCase()));
  if (match?.texto) return match.texto;

  const limpio = textoLimpio(texto);
  if (!limpio || /^(error|undefined|null|\[object object\])$/i.test(limpio)) {
    return "No se pudo completar la operaci\u00f3n. Intentalo de nuevo.";
  }
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

export { patrones, mensajeAmigable, mensajeToast };
