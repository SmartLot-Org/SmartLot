export const ROLE_NAMES = Object.freeze({
  ADMIN: 'admin', EMPLEADO: 'empleado', GARAGISTA: 'garagista', SUPERADMIN: 'superadmin', DUENO_GARAGE: 'due\u00f1o_garage',
});
export const HISTORICAL_ROLE_IDS = Object.freeze({ [ROLE_NAMES.ADMIN]: 1, [ROLE_NAMES.EMPLEADO]: 2, [ROLE_NAMES.GARAGISTA]: 3, [ROLE_NAMES.SUPERADMIN]: 4, [ROLE_NAMES.DUENO_GARAGE]: 5 });
export const ROLE_HOME_ROUTES = Object.freeze({ [ROLE_NAMES.ADMIN]: '/admin_dashboard', [ROLE_NAMES.EMPLEADO]: '/empleados_dashboard', [ROLE_NAMES.GARAGISTA]: '/garagista_dashboard', [ROLE_NAMES.SUPERADMIN]: '/superadmin_dashboard', [ROLE_NAMES.DUENO_GARAGE]: '/duenio-garage/dashboard' });
export const ROLE_LABELS = Object.freeze({ [ROLE_NAMES.ADMIN]: 'Admin', [ROLE_NAMES.EMPLEADO]: 'Empleado', [ROLE_NAMES.GARAGISTA]: 'Garagista', [ROLE_NAMES.SUPERADMIN]: 'Superadmin', [ROLE_NAMES.DUENO_GARAGE]: 'Due\u00f1o de garage' });
const ROLE_ALIASES = Object.freeze({ smartlot: ROLE_NAMES.SUPERADMIN });
export const normalizeRoleName = (value) => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return ROLE_ALIASES[normalized] || normalized;
};
export function getUserRoleName(usuario) {
  const explicitRole = normalizeRoleName(usuario?.tipo_rol);
  if (explicitRole) return explicitRole;
  const roleId = Number(usuario?.id_rol);
  return Object.entries(HISTORICAL_ROLE_IDS).find(([, id]) => id === roleId)?.[0] || '';
}
export const userHasRole = (usuario, ...roles) => roles.some((role) => typeof role === 'number' ? Number(usuario?.id_rol) === role : getUserRoleName(usuario) === normalizeRoleName(role));
export const getUserHomeRoute = (usuario, fallback = '/') => ROLE_HOME_ROUTES[getUserRoleName(usuario)] || fallback;
export const getUserRoleLabel = (usuario) => ROLE_LABELS[getUserRoleName(usuario)] || 'Usuario';
