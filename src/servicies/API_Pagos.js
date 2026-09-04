import apiClient from './apiClient';
import { invalidateByPrefix } from '../cache/cacheStore';

const logApiError = (error) => {
    if (import.meta.env.DEV) {
        console.log(error);
    }
};

const PagosCrearPreferencia = async (idReserva, backUrls) => {

    let returnObject = { respuesta: false, datos: null };

    try {

        const body = { idReserva };

        if (backUrls) {
            body.backUrls = backUrls;
        }

        const response = await apiClient.post('/api/payments/preference', body);

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

const PagosGetById = async (paymentId) => {

    let returnObject = { respuesta: false, datos: null };

    try {

        const response = await apiClient.get('/api/payments/' + paymentId, { _skipToast: true });

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

        if (amount) body.amount = amount;
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
    PagosGetById,
    PagosBuscar,
    PagosReembolsar,
    PagosWebhookEventos
};
