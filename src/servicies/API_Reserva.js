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
        returnObject.datos = error.response?.data || { message: error.message };
        return returnObject;
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

export {
    ReservasGetAll,
    ReservasGetControlAcceso,
    ReservasGetById,
    ReservasCreate,
    ReservasUpdate,
    ReservasDelete,
    ReservasCancel,
    ReservasCheckIn,
    ReservasCheckOut,
    ReservasGetDisponibilidadPorHora,
    ReservasGetByUsuario
    ,ReservasQuote
};
