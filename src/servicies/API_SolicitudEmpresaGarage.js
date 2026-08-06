import apiClient from './apiClient';
import { getFromCache, invalidateByPrefix } from '../cache/cacheStore';
import { buildSolicitudPayload } from '../helpers/tratos';

const base = '/api/solicitud-empresa-garage';
const TTL = 60 * 1000;

const result = async (key, request, options = {}) => {
  try {
    return await getFromCache(key, async () => ({ respuesta: true, datos: (await request()).data }), { ttlMs: TTL, ...options });
  } catch (error) {
    return { respuesta: false, datos: error.response?.data || { message: error.message }, status: error.response?.status || 0 };
  }
};

export const SolicitudesGetEnviadas = (options = {}) =>
  result('solicitudes:enviadas', () => apiClient.get(`${base}/enviadas`), options);

export const SolicitudesGetRecibidas = (options = {}) =>
  result('solicitudes:recibidas', () => apiClient.get(`${base}/recibidas`), options);

export const SolicitudesCreate = async (values) => {
  try {
    const response = await apiClient.post(base, buildSolicitudPayload(values));
    invalidateByPrefix('solicitudes:');
    invalidateByPrefix('garages:cercanos:');
    return { respuesta: true, datos: response.data };
  } catch (error) {
    return { respuesta: false, datos: error.response?.data || { message: error.message }, status: error.response?.status || 0 };
  }
};

const transition = async (id, action) => {
  try {
    const response = await apiClient.patch(`${base}/${id}/${action}`);
    invalidateByPrefix('solicitudes:');
    invalidateByPrefix('tratos:');
    invalidateByPrefix('garages:cercanos:');
    return { respuesta: true, datos: response.data };
  } catch (error) {
    return { respuesta: false, datos: error.response?.data || { message: error.message }, status: error.response?.status || 0 };
  }
};

export const SolicitudesAceptar = (id) => transition(id, 'aceptar');
export const SolicitudesRechazar = (id) => transition(id, 'rechazar');
