// Política de contraseñas: la misma que aplica el backend en todas las vías que fijan
// una contraseña (SmartLot_API/src/helpers/validatorHelper.js, isValidStrongPassword).
export const MENSAJE_POLITICA_CONTRASEÑA =
  'La contraseña debe tener al menos 8 caracteres, 2 mayúsculas, 2 números y 2 caracteres especiales.';

export function cumplePoliticaContraseña(valor) {
  if (typeof valor !== 'string' || valor.length < 8) return false;
  const especiales = (valor.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/g) || []).length;
  const numeros = (valor.match(/\d/g) || []).length;
  const mayusculas = (valor.match(/[A-Z]/g) || []).length;
  return especiales >= 2 && numeros >= 2 && mayusculas >= 2;
}
