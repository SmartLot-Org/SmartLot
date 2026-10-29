// Copy de la landing "/" (spec docs/specs/SPEC-landing-inmersiva.md). Vive en
// un solo módulo para revisar el relato en un lugar y que la CTA principal
// tenga la misma etiqueta en todo el flujo. Fuentes: PRODUCT.md,
// docs/domain-flows.md y docs/reservation-limit.md; nada de métricas sin
// verificar.

export const CTA_PRINCIPAL = { etiqueta: 'Registrate', destino: '/register' };

export const hero = {
  titulo: ['Gestioná.', 'Optimizá.', 'Escalá.'],
  subtitulo:
    'Tu empresa contrata plazas en garages cercanos, tu gente reserva y entra con QR, y vos auditás cada consumo. Sin hardware, sin planillas.',
  secundaria: {
    etiqueta: 'Para dueños de garages',
    destino: '/para-garages',
    ariaLabel: 'Ver cómo funciona SmartLot para dueños de garages',
  },
};

export const meta = {
  titulo: 'SmartLot — El estacionamiento del futuro',
  descripcion: hero.subtitulo,
};

export const navegacion = [
  { label: 'Cómo funciona', href: '#recorrido' },
  { label: 'Capacidades', href: '#capacidades' },
  { label: 'Contacto', href: '#contacto' },
];

export const problema = {
  titulo: 'Lugar sin asegurar, consumos sin auditar',
  cuerpo: [
    'Tu gente no tiene lugar asegurado y las reservas se arreglan de manera informal.',
    'Los acuerdos con el garage quedan de palabra y cuesta auditar los consumos por sede o por período.',
  ],
};

// Mismo orden que los encuadres de recorrido/camaras.js: el índice de cada
// paso es el que usa la escena para saber qué mostrar.
export const recorrido = {
  titulo: 'Cómo funciona',
  pasos: [
    {
      id: 'solicitud',
      titulo: 'Pedís lugar para tu gente',
      cuerpo:
        'Elegís un garage de la zona y solicitás plazas para una sede, con la modalidad de pago que te sirve.',
      figura: 'Planta de un garage de ejemplo con cinco plazas solicitadas por la empresa.',
    },
    {
      id: 'trato',
      titulo: 'El dueño confirma el trato',
      cuerpo:
        'Nada se activa sin su confirmación. El acuerdo queda registrado con plazas, modalidad y vigencia.',
      figura: 'Las cinco plazas solicitadas pasan a trato activo.',
    },
    {
      id: 'reserva',
      titulo: 'Tu gente reserva su plaza',
      cuerpo:
        'Cada persona reserva desde el celular para una fecha y un horario. Si la reserva lleva pago, la plaza queda apartada mientras se paga con Mercado Pago.',
      figura: 'Una plaza del trato queda reservada y el vehículo espera en el ingreso.',
    },
    {
      id: 'acceso',
      titulo: 'Acceso con QR, sin molinetes',
      cuerpo:
        'En el ingreso, el garagista escanea el QR de la reserva desde su celular y quedan registrados el ingreso y el egreso. No se instala hardware.',
      figura: 'La barrera se levanta con el acceso habilitado y el vehículo entra al garage.',
    },
    {
      id: 'consumo',
      titulo: 'Cada consumo, auditado',
      cuerpo:
        'Ves el detalle reserva por reserva y filtrás por sede, garage y período. Exportás en PDF o Excel.',
      figura: 'El vehículo estacionado en su plaza y el recorrido desde el ingreso, registrado.',
    },
  ],
};

export const capacidades = {
  titulo: 'Control por sede y por persona',
  cuerpo: 'Cada sede opera lo suyo y vos definís las reglas para tu gente.',
  items: [
    {
      id: 'sedes',
      titulo: 'Sedes con su propio admin',
      cuerpo: 'Cada sede tiene su admin y opera solo lo suyo; la empresa ve el conjunto.',
    },
    {
      id: 'limite',
      titulo: 'Límite de reservas por persona',
      cuerpo: 'Definís cuántas reservas activas puede tener cada persona, o la dejás sin máximo.',
    },
    {
      id: 'personal',
      titulo: 'Personal y vehículos',
      cuerpo: 'Das de alta a tu gente y cada persona carga sus vehículos; las patentes se validan al cargarlas.',
    },
    {
      id: 'cambios',
      titulo: 'Cambios con aprobación',
      cuerpo: 'Un cambio de cocheras también pasa por el dueño del garage, en dos pasos.',
    },
  ],
};

export const contacto = {
  titulo: 'Asegurale lugar a tu gente',
  cuerpo:
    'Registrá tu empresa. Revisamos la solicitud y, una vez aprobada, creás tus sedes y sumás a tu equipo.',
};
