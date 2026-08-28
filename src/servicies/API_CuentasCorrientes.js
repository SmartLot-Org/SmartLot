import apiClient from './apiClient';

export const CuentasCorrientesAdminGet = async ({ periodo, idSede, search, signal } = {}) => {
  const params = {};
  if (periodo) params.periodo = periodo;
  if (idSede) params.id_sede = idSede;
  if (search?.trim()) params.search = search.trim();
  const response = await apiClient.get('/api/cuentas-corrientes/admin', { params, signal });
  return response.data;
};

export const CuentasCorrientesSedesGet = async ({ signal } = {}) => {
  const response = await apiClient.get('/api/sede', { signal });
  return response.data;
};

export const CuentasCorrientesDuenoGet = async ({ periodo, idGarage, search, signal } = {}) => {
  const params = {};
  if (periodo) params.periodo = periodo;
  if (idGarage) params.id_garage = idGarage;
  if (search?.trim()) params.search = search.trim();
  const response = await apiClient.get('/api/cuentas-corrientes/dueno', { params, signal });
  return response.data;
};

export const CuentasCorrientesGaragesGet = async ({ signal } = {}) => {
  const response = await apiClient.get('/api/garage', { signal });
  return response.data;
};
