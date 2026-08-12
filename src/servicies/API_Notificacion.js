import apiClient from './apiClient';
import { getFromCache, invalidateByPrefix } from '../cache/cacheStore';

const TTL = 30 * 1000;
const base = '/api/notificacion';

const result = async (key, request, options = {}) => {
  try {
    return await getFromCache(key, async () => ({ respuesta: true, datos: (await request()).data }), { ttlMs: TTL, ...options });
  } catch (error) {
    return { respuesta: false, datos: error.response?.data || { message: error.message }, status: error.response?.status || 0 };
  }
};

const mutate = async (request) => {
  try {
    const response = await request();
    invalidateByPrefix('notificaciones:');
    return { respuesta: true, datos: response.data };
  } catch (error) {
    return { respuesta: false, datos: error.response?.data || { message: error.message }, status: error.response?.status || 0 };
  }
};

export const NotificacionesGetAll = (options = {}) => result('notificaciones:all', () => apiClient.get(base), options);
export const NotificacionesGetNoLeidas = (options = {}) => result('notificaciones:no-leidas:count', () => apiClient.get(`${base}/no-leidas/count`), options);
export const NotificacionesMarcarLeida = (id) => mutate(() => apiClient.patch(`${base}/${id}/leer`));
export const NotificacionesMarcarTodasLeidas = () => mutate(() => apiClient.patch(`${base}/leer-todas`));
export const NotificacionesEliminar = (id) => mutate(() => apiClient.delete(`${base}/${id}`));
