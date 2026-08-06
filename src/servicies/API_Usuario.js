import apiClient from './apiClient';
import { clearCache, getFromCache, invalidateByPrefix } from '../cache/cacheStore';

const USUARIOS_TTL_MS = 60 * 1000;

const logApiError = (error) => {
    if (import.meta.env.DEV) {
        console.log(error);
    }
};

const invalidateUsuariosDependencies = () => {
    invalidateByPrefix('usuarios:');
    invalidateByPrefix('reservas:');
    invalidateByPrefix('conflictos:');
    invalidateByPrefix('vehiculos:');
};

const UsuariosGetAll = async ({ force = false } = {}) => {

    let returnObject = { respuesta: false, datos: [] };

    let url = '/api/usuario';

    try {

        return await getFromCache(
            'usuarios:all',
            async () => {
                const response = await apiClient.get(url);

                returnObject.respuesta = true;
                returnObject.datos = response.data;

                return returnObject;
            },
            { ttlMs: USUARIOS_TTL_MS, force }
        );

    } catch (error) {

        logApiError(error);
        return returnObject;
    }
};



const UsuariosGetByGarage = async (idGarage, { force = false } = {}) => {

    let returnObject = { respuesta: false, datos: [] };

    let url = '/api/usuario/garage/' + idGarage;

    try {

        return await getFromCache(
            'usuarios:garage:' + idGarage,
            async () => {
                const response = await apiClient.get(url);

                returnObject.respuesta = true;
                returnObject.datos = response.data;

                return returnObject;
            },
            { ttlMs: USUARIOS_TTL_MS, force }
        );

    } catch (error) {

        logApiError(error);
        return returnObject;
    }
};

const UsuariosGetById = async (id, { force = false } = {}) => {

    let returnObject = { respuesta: false, datos: [] };

    let url = '/api/usuario/' + id;

    try {

        return await getFromCache(
            'usuarios:id:' + id,
            async () => {
                const response = await apiClient.get(url);

                returnObject.respuesta = true;
                returnObject.datos = response.data;

                return returnObject;
            },
            { ttlMs: USUARIOS_TTL_MS, force }
        );

    } catch (error) {

        logApiError(error);
        return returnObject;
    }
};

const UsuariosGetAuditoria = async ({ force = false } = {}) => {

    let returnObject = { respuesta: false, datos: [] };

    let url = '/api/usuario/auditoria';

    try {

        return await getFromCache(
            'usuarios:auditoria',
            async () => {
                const response = await apiClient.get(url);

                returnObject.respuesta = true;
                returnObject.datos = response.data;

                return returnObject;
            },
            { ttlMs: USUARIOS_TTL_MS, force }
        );

    } catch (error) {

        logApiError(error);
        return returnObject;
    }
};



const UsuariosCreate = async (usuario) => {

    let returnObject = { respuesta: false, datos: null };

    let url = '/api/usuario';

    try {

        const response = await apiClient.post(url, usuario);

        returnObject.respuesta = true;
        returnObject.datos = response.data;
        invalidateUsuariosDependencies();

        return returnObject;

    } catch (error) {

        logApiError(error);
        returnObject.datos = error.response?.data || null;
        return returnObject;
    }
};



const UsuariosUpdate = async (id, usuario) => {

    let returnObject = { respuesta: false, datos: null };

    let url = '/api/usuario/' + id;

    try {

        const response = await apiClient.put(url, usuario);

        returnObject.respuesta = true;
        returnObject.datos = response.data;
        invalidateUsuariosDependencies();

        return returnObject;

    } catch (error) {

        logApiError(error);
        return returnObject;
    }
};

const UsuariosPatchEstado = async (id, activo) => {
    let returnObject = { respuesta: false, datos: null };
    let url = '/api/usuario/' + id + '/estado';

    try {
        // Se envía un objeto solo con el campo "activo"
        const response = await apiClient.patch(url, { activo });
        returnObject.respuesta = true;
        returnObject.datos = response.data;
        invalidateUsuariosDependencies();
        return returnObject;
    } catch (error) {
        logApiError(error);
        return returnObject;
    }
};



const UsuariosDelete = async (id) => {

    let returnObject = { respuesta: false };

    let url = '/api/usuario/' + id;

    try {

        await apiClient.delete(url);

        returnObject.respuesta = true;
        invalidateUsuariosDependencies();

        return returnObject;

    } catch (error) {

        logApiError(error);
        return returnObject;
    }
};

const UsuariosLogin = async (email, contraseña) => {

    let returnObject = { respuesta: false, datos: null };

    let url = '/api/usuario/login';

    try {

        const response = await apiClient.post(url, { email, contraseña });

        returnObject.respuesta = true;
        returnObject.datos = response.data;
        clearCache();

        return returnObject;

    } catch (error) {

        logApiError(error);
        return returnObject;
    }
};

const UsuariosImpersonate = async (id) => {

    let returnObject = { respuesta: false, datos: null };

    let url = '/api/usuario/impersonate';

    try {

        const response = await apiClient.post(url, { id });

        returnObject.respuesta = true;
        returnObject.datos = response.data;
        clearCache();

        return returnObject;

    } catch (error) {

        logApiError(error);
        return returnObject;
    }
};

const UsuariosStopImpersonate = async () => {
    try {
        const response = await apiClient.post('/api/usuario/stop-impersonate');
        clearCache();
        return { respuesta: true, datos: response.data };
    } catch (error) {
        logApiError(error);
        return { respuesta: false, datos: error.response?.data || { message: error.message } };
    }
};

export {
    UsuariosGetAll,
    UsuariosGetAuditoria,
    UsuariosGetByGarage,
    UsuariosGetById,
    UsuariosCreate,
    UsuariosUpdate,
    UsuariosDelete,
    UsuariosPatchEstado,
    UsuariosLogin,
    UsuariosImpersonate,
    UsuariosStopImpersonate
};
