import axios from 'axios';
import Swal from 'sweetalert2';
import { Z_INDEX } from '../helpers/zIndex';
import { mensajeToast } from '../helpers/erroresMensajes';
import { navigateTo } from './navigation';
import { clearCache, invalidateByPrefix } from '../cache/cacheStore';

const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3000');

if (import.meta.env.PROD) {
  if (!API_BASE_URL.startsWith('https://')) {
    console.error('VITE_API_URL debe usar HTTPS en producción');
  }
}

let ultimoToast = { titulo: '', hora: 0 };

function showToast(message, icon = 'error') {
  const titulo = mensajeToast(message);
  const ahora = Date.now();

  // Evita repetir la misma card si varias requests fallan en cadena
  if (titulo === ultimoToast.titulo && ahora - ultimoToast.hora < 5000) return;
  ultimoToast = { titulo, hora: ahora };

  Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title: titulo,
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    zIndex: Z_INDEX.SWAL_TOAST,
  });
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
}

function shouldClearCacheForAuthUrl(url = '') {
  return url.includes('/api/usuario/login')
    || url.includes('/api/usuario/logout')
    || url.includes('/api/usuario/impersonate');
}

function invalidateCacheForMutation(config = {}) {
  const method = config.method?.toLowerCase();
  const url = config.url || '';

  if (!['post', 'put', 'patch', 'delete'].includes(method)) {
    return;
  }

  if (url.includes('/api/usuario/refresh')) {
    return;
  }

  if (url.includes('/api/usuario')) {
    invalidateByPrefix('usuarios:');
    invalidateByPrefix('reservas:');
    invalidateByPrefix('conflictos:');
    invalidateByPrefix('vehiculos:');
    invalidateByPrefix('tratos:');
  }

  if (url.includes('/api/empresa')) {
    invalidateByPrefix('empresas:');
    invalidateByPrefix('usuarios:');
    invalidateByPrefix('sedes:');
    invalidateByPrefix('garages:');
    invalidateByPrefix('reservas:');
    invalidateByPrefix('conflictos:');
    invalidateByPrefix('tratos:');
  }

  if (url.includes('/api/sede')) {
    invalidateByPrefix('sedes:');
    invalidateByPrefix('usuarios:');
    invalidateByPrefix('garages:');
    invalidateByPrefix('reservas:');
    invalidateByPrefix('conflictos:');
  }

  if (url.includes('/api/garage')) {
    invalidateByPrefix('garages:');
    invalidateByPrefix('usuarios:');
    invalidateByPrefix('reservas:');
    invalidateByPrefix('conflictos:');
    invalidateByPrefix('reservas:disponibilidad:');
    invalidateByPrefix('tratos:');
  }

  if (url.includes('/api/trato-empresa-garage')) {
    invalidateByPrefix('tratos:');
    invalidateByPrefix('garages:');
    invalidateByPrefix('empresas:');
  }

  if (url.includes('/api/reserva')) {
    invalidateByPrefix('reservas:');
    invalidateByPrefix('garages:');
    invalidateByPrefix('garages:ocupacion-');
    invalidateByPrefix('conflictos:');
    invalidateByPrefix('reservas:disponibilidad:');
  }

  if (url.includes('/api/conflicto')) {
    invalidateByPrefix('conflictos:');
    invalidateByPrefix('reservas:');
    invalidateByPrefix('garages:');
    invalidateByPrefix('garages:ocupacion-');
    invalidateByPrefix('reservas:disponibilidad:');
  }

  if (url.includes('/api/vehiculo')) {
    invalidateByPrefix('vehiculos:');
    invalidateByPrefix('reservas:');
  }

  if (url.includes('/api/marca')) {
    invalidateByPrefix('marcas:');
    invalidateByPrefix('modelos:');
    invalidateByPrefix('vehiculos:');
  }

  if (url.includes('/api/modelo')) {
    invalidateByPrefix('modelos:');
    invalidateByPrefix('vehiculos:');
  }

  if (url.includes('/api/rol')) {
    invalidateByPrefix('roles:');
    invalidateByPrefix('usuarios:');
  }
}

apiClient.interceptors.response.use(
  (response) => {
    if (shouldClearCacheForAuthUrl(response.config?.url)) {
      clearCache();
    }

    invalidateCacheForMutation(response.config);

    return response;
  },
  async (error) => {
    const originalRequest = error.config ?? {};
    const data = error.response?.data;
    const status = data?.statusCode ?? error.response?.status ?? 0;
    const message = data?.message ?? 'No se pudo completar la operación. Intentá nuevamente.';

    if (originalRequest._skipToast) {
      return Promise.reject(error);
    }

    // 401 → intentar refresh automático (excepto refresh y auth endpoints)
    if (status === 401 && !originalRequest._isRetry && !originalRequest.url?.includes('/refresh') && !originalRequest.url?.includes('/auth/')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => apiClient(originalRequest));
      }

      originalRequest._isRetry = true;
      isRefreshing = true;

      try {
        await apiClient.post('/api/usuario/refresh', {}, { _skipAuthRedirect: true, _isRetry: true });
        processQueue(null);
        return apiClient(originalRequest);
      } catch {
        processQueue(error);
        if (!originalRequest._skipAuthRedirect) {
          clearCache();
          navigateTo('/login');
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 401) {
      if (!originalRequest._skipAuthRedirect) {
        clearCache();
        navigateTo('/login');
      }
      return Promise.reject(error);
    }

    const method = originalRequest.method?.toLowerCase();
    const esMutacion = ['post', 'put', 'patch', 'delete'].includes(method);
    const esCancelado = axios.isCancel(error) || error.code === 'ERR_CANCELED';

    // Solo mostramos toast cuando falla una acción del usuario (mutación);
    // los GET de carga de datos ya muestran su error en la propia pantalla.
    if (esCancelado || !esMutacion) {
      return Promise.reject(error);
    }

    if (!error.response) {
      showToast('No se pudo conectar con el servidor. Revisá tu conexión a internet.', 'error');
      return Promise.reject(error);
    }

    switch (status) {
      case 403:
      case 429:
        showToast(message, 'warning');
        break;
      case 413:
        showToast('El archivo o los datos enviados son demasiado grandes.', 'error');
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        showToast('El servidor tuvo un problema. Intentá nuevamente en unos segundos.', 'error');
        break;
      default:
        showToast(message, 'error');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
