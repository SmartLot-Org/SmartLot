import apiClient from "./apiClient";

const logApiError = (error) => {
  if (import.meta.env.DEV) {
    console.log(error);
  }
};

const normalizarRespuesta = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.datos)) return data.datos;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.solicitudes)) return data.solicitudes;
  if (Array.isArray(data?.value)) return data.value;
  return [];
};

const SolicitudesGarageGetAll = async () => {
  const endpoints = [
    "/api/solicitud-garage",
    "/api/solicitudes-garage",
    "/api/solicitudes/garage",
  ];

  for (const url of endpoints) {
    try {
      const response = await apiClient.get(url, { _skipToast: true });
      return {
        respuesta: true,
        datos: normalizarRespuesta(response.data),
        endpoint: url,
      };
    } catch (error) {
      logApiError(error);
    }
  }

  return { respuesta: false, datos: [] };
};

const SolicitudGarageUpdateEstado = async (id, estado) => {
  const endpoints = [
    `/api/solicitud-garage/${id}`,
    `/api/solicitudes-garage/${id}`,
    `/api/solicitudes/garage/${id}`,
  ];

  for (const url of endpoints) {
    try {
      const response = await apiClient.patch(url, { estado }, { _skipToast: true });
      return { respuesta: true, datos: response.data };
    } catch (error) {
      logApiError(error);
    }
  }

  return { respuesta: false, datos: null };
};

export { SolicitudesGarageGetAll, SolicitudGarageUpdateEstado };
