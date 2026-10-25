import apiClient from './apiClient';
import { invalidateByPrefix } from '../cache/cacheStore';

const logApiError = (error) => {
    if (import.meta.env.DEV) {
        console.log(error);
    }
};

const PagosCrearPreferencia = async ({ consumosIds, idSede, idGarage, periodo, backUrls }) => {
    try {
        const response = await apiClient.post('/api/payments/preference', { consumosIds, idSede, idGarage, periodo, backUrls });
        return { respuesta: true, datos: response.data };
    } catch (error) {
        logApiError(error);
        return { respuesta: false, datos: error.response?.data || { message: error.message }, status: error.response?.status || 0 };
    }
};

const PagosCrearPreferenciaReserva = async (idReserva) => {
    try {
        const response = await apiClient.post('/api/payments/preference', { idReserva });
        return { respuesta: true, datos: response.data };
    } catch (error) {
        logApiError(error);
        return {
            respuesta: false,
            datos: error.response?.data || { message: error.message },
            status: error.response?.status || 0,
        };
    }
};

// Verifica el pago contra Mercado Pago y sincroniza el registro local. Es un POST porque
// escribe: el GET del backend solo lee el estado que ya está guardado.
const PagosGetById = async (paymentId, contexto = {}) => {

    let returnObject = { respuesta: false, datos: null };

    try {

        const body = {};
        if (contexto.external_reference) body.externalReference = contexto.external_reference;
        if (contexto.preference_id) body.preferenceId = contexto.preference_id;
        const response = await apiClient.post('/api/payments/' + paymentId + '/verificar', body, { _skipToast: true });

        returnObject.respuesta = true;
        returnObject.datos = response.data;

        return returnObject;

    } catch (error) {

        logApiError(error);
        returnObject.datos = error.response?.data || { message: error.message };
        returnObject.status = error.response?.status || 0;
        return returnObject;
    }
};

const PagosBuscar = async (filtros = {}) => {

    let returnObject = { respuesta: false, datos: null };

    try {

        const params = {};

        if (filtros.external_reference) params.external_reference = filtros.external_reference;
        if (filtros.status) params.status = filtros.status;
        if (filtros.from) params.from = filtros.from;
        if (filtros.to) params.to = filtros.to;
        if (filtros.limit) params.limit = filtros.limit;
        if (filtros.offset) params.offset = filtros.offset;

        // Buscar por referencia también sincroniza con Mercado Pago; como eso escribe,
        // el backend lo expone aparte (POST) y el listado posterior es una lectura pura.
        if (filtros.external_reference) {
            await apiClient.post('/api/payments/verificar', { externalReference: filtros.external_reference }, { _skipToast: true });
        }
        const response = await apiClient.get('/api/payments', { params, _skipToast: true });

        returnObject.respuesta = true;
        returnObject.datos = response.data;

        return returnObject;

    } catch (error) {

        logApiError(error);
        returnObject.datos = error.response?.data || { message: error.message };
        returnObject.status = error.response?.status || 0;
        return returnObject;
    }
};

const PagosReembolsar = async (paymentId, amount, motivo) => {

    let returnObject = { respuesta: false, datos: null };

    try {

        const body = {};

        if (amount !== undefined && amount !== null && amount !== '') body.amount = amount;
        if (motivo) body.motivo = motivo;

        const response = await apiClient.post('/api/payments/' + paymentId + '/refund', body);

        returnObject.respuesta = true;
        returnObject.datos = response.data;
        invalidateByPrefix('pagos:');

        return returnObject;

    } catch (error) {

        logApiError(error);
        returnObject.datos = error.response?.data || { message: error.message };
        returnObject.status = error.response?.status || 0;
        return returnObject;
    }
};

const PagosWebhookEventos = async () => {

    let returnObject = { respuesta: false, datos: [] };

    try {

        const response = await apiClient.get('/api/payments/webhook-events', { _skipToast: true });

        returnObject.respuesta = true;
        returnObject.datos = response.data?.eventos || response.data || [];

        return returnObject;

    } catch (error) {

        logApiError(error);
        returnObject.datos = error.response?.data || { message: error.message };
        returnObject.status = error.response?.status || 0;
        return returnObject;
    }
};

export {
    PagosCrearPreferencia,
    PagosCrearPreferenciaReserva,
    PagosGetById,
    PagosBuscar,
    PagosReembolsar,
    PagosWebhookEventos
};
