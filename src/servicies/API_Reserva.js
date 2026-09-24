import apiClient from './apiClient';
import { getFromCache, invalidateByPrefix } from '../cache/cacheStore';

const RESERVAS_TTL_MS = 15 * 1000;

const logApiError = (error) => {
    if (import.meta.env.DEV) {
        console.log(error);
    }
};

const invalidateReservasDependencies = () => {
    invalidateByPrefix('reservas:');
    invalidateByPrefix('garages:');
    invalidateByPrefix('garages:ocupacion-');
    invalidateByPrefix('conflictos:');
    invalidateByPrefix('reservas:disponibilidad:');
};

const normalizarPayloadQr = (payload) => payload?.data ?? payload?.datos ?? payload;

const normalizarErrorQr = (error) => {
    const payload = error.response?.data;
    const status = error.response?.status;
    const message = typeof payload === 'string'
        ? payload
        : payload?.message
            ?? payload?.mensaje
            ?? payload?.error?.message
            ?? (typeof payload?.error === 'string' ? payload.error : null)
            ?? error.message
            ?? (status ? `La solicitud del QR falló con HTTP ${status}.` : 'No se pudo conectar con el servidor.');

    return {
        ...(payload && typeof payload === 'object' ? payload : {}),
        message: status && (!message || message === 'Request failed with status code ' + status)
            ? `La solicitud del QR falló con HTTP ${status}.`
            : message,
        status,
    };
};

const ReservasGetAll = async ({ force = false } = {}) => {

    let returnObject = { respuesta: false, datos: [] };

    let url = '/api/reserva';

    try {

        return await getFromCache(
            'reservas:all',
            async () => {
                const response = await apiClient.get(url);

                returnObject.respuesta = true;
                returnObject.datos = response.data;

                return returnObject;
            },
            { ttlMs: RESERVAS_TTL_MS, force }
        );

    } catch (error) {

        logApiError(error);
        return returnObject;
    }
};

const ReservasGetControlAcceso = async (idGarage, fecha, { force = false } = {}) => {
    const returnObject = { respuesta: false, datos: [] };

    try {
        return await getFromCache(
            `reservas:control-acceso:${idGarage}:${fecha}`,
            async () => {
                const response = await apiClient.get(`/api/reserva/control-acceso/${idGarage}`, {
                    params: { fecha },
                });
                return { respuesta: true, datos: response.data };
            },
            { ttlMs: RESERVAS_TTL_MS, force }
        );
    } catch (error) {
        logApiError(error);

        // Algunos despliegues todavia no habilitan control-acceso para el rol
        // garagista. La ruta general sigue protegida por sesion y se solicita
        // acotada al mismo garage y fecha; la vista vuelve a validar ambos.
        try {
            const response = await apiClient.get('/api/reserva', {
                params: { id_garage: idGarage, fecha },
            });
            return { respuesta: true, datos: response.data, origen: 'fallback' };
        } catch (fallbackError) {
            logApiError(fallbackError);
            returnObject.datos = fallbackError.response?.data
                || error.response?.data
                || { message: fallbackError.message || error.message };
            return returnObject;
        }
    }
};



const ReservasGetById = async (id, { force = false } = {}) => {

    let returnObject = { respuesta: false, datos: [] };

    let url = '/api/reserva/' + id;

    try {

        return await getFromCache(
            'reservas:id:' + id,
            async () => {
                const response = await apiClient.get(url);

                returnObject.respuesta = true;
                returnObject.datos = response.data;

                return returnObject;
            },
            { ttlMs: RESERVAS_TTL_MS, force }
        );

    } catch (error) {

        logApiError(error);
        return returnObject;
    }
};



const ReservasCreate = async (reserva) => {

    let returnObject = { respuesta: false, datos: null };

    let url = '/api/reserva';

    try {

        const response = await apiClient.post(url, reserva);

        returnObject.respuesta = true;
        returnObject.datos = response.data;
        invalidateReservasDependencies();

        return returnObject;

    } catch (error) {

        logApiError(error);
        returnObject.datos = error.response?.data || { message: error.message };
        return returnObject;
    }
};

const ReservasQuote = async (reserva) => {
    try {
        const response = await apiClient.post('/api/reserva/cotizacion', reserva);
        return { respuesta: true, datos: response.data };
    } catch (error) {
        return { respuesta: false, datos: error.response?.data || { message: error.message } };
    }
};



const ReservasUpdate = async (id, reserva) => {

    let returnObject = { respuesta: false, datos: null };

    let url = '/api/reserva/' + id;

    try {

        const response = await apiClient.put(url, reserva);

        returnObject.respuesta = true;
        returnObject.datos = response.data;
        invalidateReservasDependencies();

        return returnObject;

    } catch (error) {

        logApiError(error);
        return returnObject;
    }
};



const ReservasDelete = async (id) => {

    let returnObject = { respuesta: false };

    let url = '/api/reserva/' + id;

    try {

        await apiClient.delete(url);

        returnObject.respuesta = true;
        invalidateReservasDependencies();

        return returnObject;

    } catch (error) {

        logApiError(error);
        return returnObject;
    }
};



const ReservasCancel = async (id) => {

    let returnObject = { respuesta: false };

    let url = '/api/reserva/' + id + '/cancel';

    try {

        await apiClient.post(url);

        returnObject.respuesta = true;
        invalidateReservasDependencies();

        return returnObject;

    } catch (error) {

        logApiError(error);
        return returnObject;
    }
};

const ReservasLiberarRetencion = async (id) => {
    const returnObject = { respuesta: false };

    try {
        await apiClient.post(`/api/reserva/${id}/liberar-retencion`, {}, { _skipToast: true });
        returnObject.respuesta = true;
        invalidateReservasDependencies();
    } catch (error) {
        logApiError(error);
        returnObject.datos = error.response?.data || { message: error.message };
    }

    return returnObject;
};

const ReservasCheckIn = async (id, patente) => {
    const returnObject = { respuesta: false, datos: null };

    try {
        const response = await apiClient.post(
            '/api/reserva/' + id + '/check-in',
            { patente },
            { _skipToast: true }
        );
        returnObject.respuesta = true;
        returnObject.datos = response.data;
        invalidateReservasDependencies();
    } catch (error) {
        logApiError(error);
        returnObject.datos = error.response?.data || { message: error.message };
    }

    return returnObject;
};

const ReservasCheckOut = async (id, patente) => {
    const returnObject = { respuesta: false, datos: null };

    try {
        const response = await apiClient.post(
            '/api/reserva/' + id + '/check-out',
            { patente },
            { _skipToast: true }
        );
        returnObject.respuesta = true;
        returnObject.datos = response.data;
        invalidateReservasDependencies();
    } catch (error) {
        logApiError(error);
        returnObject.datos = error.response?.data || { message: error.message };
    }

    return returnObject;
};



const ReservasGetByUsuario = async (idUsuario, { force = false } = {}) => {

    let returnObject = { respuesta: false, datos: [] };

    let url = '/api/reserva/usuario/' + idUsuario;

    try {

        return await getFromCache(
            'reservas:usuario:' + idUsuario,
            async () => {
                const response = await apiClient.get(url, { validateStatus: () => true });

                if (response.status >= 200 && response.status < 300) {
                    returnObject.respuesta = true;
                    returnObject.datos = response.data;
                }

                return returnObject;
            },
            { ttlMs: RESERVAS_TTL_MS, force }
        );

    } catch (error) {

        logApiError(error);
        return returnObject;
    }
};

const ReservasGetDisponibilidadPorHora = async (garageId, fecha, { force = false } = {}) => {

    let returnObject = { respuesta: false, datos: [] };

    let url = '/api/reserva/disponibilidad-por-hora?garage_id=' + garageId + '&fecha=' + fecha;

    try {

        return await getFromCache(
            'reservas:disponibilidad:' + garageId + ':' + fecha,
            async () => {
                const response = await apiClient.get(url);

                returnObject.respuesta = true;
                returnObject.datos = response.data;

                return returnObject;
            },
            { ttlMs: RESERVAS_TTL_MS, force }
        );

    } catch (error) {

        logApiError(error);
        return returnObject;
    }
};
const ReservasGetQr = async (id) => {
    const returnObject = {
        respuesta: false,
        datos: null,
    };

    try {
        const response = await apiClient.get(`/api/reserva/${id}/qr`, { _skipToast: true });

        const datos = normalizarPayloadQr(response.data);
        returnObject.respuesta = Boolean(datos?.qr);
        returnObject.datos = datos?.qr
            ? datos
            : { ...datos, message: datos?.message ?? datos?.mensaje ?? 'El servidor respondió sin un código QR.' };
    } catch (error) {
        logApiError(error);
        returnObject.datos = normalizarErrorQr(error);
    }

    return returnObject;
};

const ReservasCheckInQr = async (qr) => {
    const returnObject = {
        respuesta: false,
        datos: null,
    };

    try {
        const response = await apiClient.post(
            '/api/reserva/qr/check-in',
            { qr },
            { _skipToast: true }
        );

        returnObject.respuesta = true;
        returnObject.datos = normalizarPayloadQr(response.data);

        invalidateReservasDependencies();
    } catch (error) {
        logApiError(error);
        returnObject.datos = normalizarErrorQr(error);
    }

    return returnObject;
};

const ReservasCheckOutQr = async (qr) => {
    const returnObject = {
        respuesta: false,
        datos: null,
    };

    try {
        const response = await apiClient.post(
            '/api/reserva/qr/check-out',
            { qr },
            { _skipToast: true }
        );

        returnObject.respuesta = true;
        returnObject.datos = normalizarPayloadQr(response.data);
        invalidateReservasDependencies();
    } catch (error) {
        logApiError(error);
        returnObject.datos = normalizarErrorQr(error);
    }

    return returnObject;
};




export {
    ReservasGetAll,
    ReservasGetControlAcceso,
    ReservasGetById,
    ReservasCreate,
    ReservasUpdate,
    ReservasDelete,
    ReservasCancel,
    ReservasLiberarRetencion,
    ReservasCheckIn,
    ReservasCheckOut,
    ReservasGetDisponibilidadPorHora,
    ReservasGetByUsuario,
    ReservasQuote,
    ReservasGetQr,
    ReservasCheckInQr,
    ReservasCheckOutQr

};
