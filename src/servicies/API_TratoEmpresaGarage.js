import apiClient from './apiClient';
import { getFromCache, invalidateByPrefix } from '../cache/cacheStore';
import { parsePositiveInteger } from '../helpers/tratos';

const TTL = 5 * 60 * 1000;
const base = '/api/trato-empresa-garage';
const result = async (key, request, options) => {
  try {
    return await getFromCache(key, async () => ({ respuesta: true, datos: (await request()).data }), { ttlMs: TTL, ...options });
  } catch (error) {
    return { respuesta: false, datos: error.response?.data || { message: error.message }, status: error.response?.status || 0 };
  }
};
const mutate = async (request) => {
  try {
    const response = await request();
    invalidateByPrefix('tratos:');
    return { respuesta: true, datos: response.data };
  } catch (error) {
    return { respuesta: false, datos: error.response?.data || { message: error.message }, status: error.response?.status || 0 };
  }
};
export const TratosGetAll = (options = {}) => result('tratos:all', () => apiClient.get(base), options);
export const TratosGetById = (id, options = {}) => { const safe = parsePositiveInteger(id); return result(`tratos:id:${safe}`, () => apiClient.get(`${base}/${safe}`), options); };
export const TratosGetByEmpresa = (id, options = {}) => { const safe = parsePositiveInteger(id); return result(`tratos:empresa:${safe}`, () => apiClient.get(`${base}/empresa/${safe}`), options); };
export const TratosGetByGarage = (id, options = {}) => { const safe = parsePositiveInteger(id); return result(`tratos:garage:${safe}`, () => apiClient.get(`${base}/garage/${safe}`), options); };
export const TratosCreate = (trato) => mutate(() => apiClient.post(base, trato));
export const TratosUpdate = (id, trato) => { const safe = parsePositiveInteger(id); return mutate(() => apiClient.put(`${base}/${safe}`, trato)); };
export const TratosDelete = (id) => { const safe = parsePositiveInteger(id); return mutate(() => apiClient.delete(`${base}/${safe}`)); };
