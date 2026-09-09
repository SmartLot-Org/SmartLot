import apiClient from './apiClient';
import { getFromCache, invalidateByPrefix } from '../cache/cacheStore';

const base = '/api/solicitud-registro';
const TTL = 60 * 1000;

const result = async (key, request, options = {}) => {
  try {
    return await getFromCache(
      key,
      async () => ({ respuesta: true, datos: (await request()).data }),
      { ttlMs: TTL, ...options }
    );
  } catch (error) {
    return {
      respuesta: false,
      datos: error.response?.data || { message: error.message },
      status: error.response?.status || 0,
    };
  }
};

export const SolicitudesRegistroGetAll = (options = {}) =>
  result('solicitudes-registro:all', () => apiClient.get(base), options);

const transition = async (id, action) => {
  try {
    const response = await apiClient.patch(`${base}/${id}/${action}`);
    invalidateByPrefix('solicitudes-registro:');
    invalidateByPrefix('usuarios:');
    invalidateByPrefix('empresas:');
    return { respuesta: true, datos: response.data };
  } catch (error) {
    return {
      respuesta: false,
      datos: error.response?.data || { message: error.message },
      status: error.response?.status || 0,
    };
  }
};

export const SolicitudesRegistroAprobar = (id) => transition(id, 'aprobar');
export const SolicitudesRegistroRechazar = (id) => transition(id, 'rechazar');
