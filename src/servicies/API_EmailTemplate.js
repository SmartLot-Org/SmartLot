// API_EmailTemplate.js
// Backoffice de plantillas de email (solo superadmin). El backend valida el rol.
import apiClient from './apiClient';

const base = '/api/email-template';

const result = async (request) => {
  try {
    return { respuesta: true, datos: (await request()).data };
  } catch (error) {
    return {
      respuesta: false,
      datos: error.response?.data || { message: error.message },
      status: error.response?.status || 0,
    };
  }
};

const mutate = async (request) => {
  try {
    return { respuesta: true, datos: (await request()).data };
  } catch (error) {
    return {
      respuesta: false,
      datos: error.response?.data || { message: error.message },
      status: error.response?.status || 0,
    };
  }
};

export const EmailTemplatesGetAll = () => result(() => apiClient.get(base));

export const EmailTemplateGet = (codigo) => result(() => apiClient.get(`${base}/${codigo}`));

export const EmailTemplatePreview = (codigo, params = {}) =>
  result(() => apiClient.get(`${base}/${codigo}/preview`, { params }));

export const EmailTemplateTest = (codigo, payload) =>
  mutate(() => apiClient.post(`${base}/${codigo}/test`, payload));

export const EmailTemplateUpdate = (codigo, payload) =>
  mutate(() => apiClient.put(`${base}/${codigo}`, payload));