// Contenido de la landing: todo el texto vive acá, nunca en los componentes.
// Fuente: PRODUCT.md y docs/specs/SPEC-landing-inmersiva.md. No se agregan
// métricas, testimonios ni logos que no haya dado el dueño del producto.

export const META = {
  titulo: 'SmartLot — Cocheras para tu equipo, cerca de la oficina',
  descripcion:
    'SmartLot conecta a tu empresa con garages que tienen plazas libres cerca de cada sede. Reservas, acceso con QR y consumos en un solo panel. Sin hardware, sin planillas.',
};

// Una sola acción principal, con la misma etiqueta en el hero, la barra y el cierre.
export const CTA = {
  principal: { etiqueta: 'Registrate', destino: '/register' },
  secundaria: { etiqueta: 'Tengo un garage', destino: '/para-garages' },
};

export const NAVEGACION = {
  marca: 'SmartLot',
  ingresar: { etiqueta: 'Iniciar sesión', destino: '/login' },
  panel: 'Ir a mi panel',
  saltar: 'Saltar al contenido',
  sin3d: { activar: 'Ver sin 3D', desactivar: 'Volver al 3D' },
  pie: 'Gestión de estacionamientos para empresas y garages.',
};

// Datos del dibujo: son de demostración y así se rotulan en pantalla.
export const DEMO = {
  aviso: 'Datos de ejemplo',
  plazasDelTrato: 25,
  reservadas: 'plazas del trato, reservadas hoy',
  // Mismas columnas que el detalle de consumos del producto: tiempo, tarifa e importe por reserva.
  consumos: {
    titulo: 'Consumos de la semana',
    columnas: ['Reserva', 'Tiempo', 'Tarifa', 'Importe'],
    filas: [
      { reserva: 'Lun 16 · plaza 14', tiempo: '8 h 30 min', tarifa: '$ 1.200/h', importe: '$ 10.200' },
      { reserva: 'Mar 17 · plaza 08', tiempo: '9 h 00 min', tarifa: '$ 1.200/h', importe: '$ 10.800' },
      { reserva: 'Mié 18 · plaza 21', tiempo: '4 h 15 min', tarifa: '$ 1.200/h', importe: '$ 5.100' },
      { reserva: 'Jue 19 · plaza 14', tiempo: '8 h 45 min', tarifa: '$ 1.200/h', importe: '$ 10.500' },
    ],
    total: { etiqueta: 'Total', importe: '$ 36.600' },
    exportar: 'Se exporta a PDF y Excel',
  },
};

// Rótulos del dibujo (decorativos: el contenido real está en las secciones).
export const ROTULOS = {
  oficina: 'Tu oficina',
  senal: 'E',
  entrada: 'Entrada',
  ingreso: 'Ingreso registrado',
  hora: '08:57',
};

// weight = alto de la sección en pantallas (cuánto scroll dura).
export const SECCIONES = [
  {
    id: 'gancho',
    titulo: 'Cocheras para tu equipo, cerca de la oficina',
    cuerpo:
      'SmartLot conecta a tu empresa con garages que tienen plazas libres cerca de cada sede. Sin hardware, sin planillas.',
    movimiento: 'desciende',
    weight: 1,
    cta: true,
    figura: 'Plano de una zona de la ciudad: un edificio de oficinas en el centro y tres garages cercanos marcados con el cartel de estacionamiento.',
  },
  {
    id: 'problema',
    titulo: 'Acuerdos de palabra y vueltas a la manzana',
    cuerpo:
      'Hoy los acuerdos se arreglan por WhatsApp o en papel, las cocheras quedan vacías y nadie sabe cuánto se usó cada lugar.',
    movimiento: 'orbita',
    weight: 1.3,
    figura: 'La manzana de la oficina: varios autos dan vueltas alrededor sin encontrar lugar.',
  },
  {
    id: 'idea',
    titulo: 'Un trato claro entre empresa y garage',
    cuerpo:
      'La empresa pide plazas para una sede y el dueño del garage acepta o rechaza. Nada se activa sin su confirmación.',
    movimiento: 'se traza',
    weight: 1.6,
    figura: 'Una línea azul recorre la calle desde la oficina hasta un garage a 300 metros, que queda marcado en azul.',
  },
  {
    id: 'reserva',
    titulo: 'Cada persona reserva su lugar',
    cuerpo:
      'Cada empleado elige día y horario desde el celular. La empresa define cuántas reservas activas puede tener cada uno.',
    movimiento: 'se llena',
    weight: 1.6,
    dato: 'reservadas',
    figura: 'Planta del garage sin techo: cuatro filas de plazas, con las reservadas por el equipo pintadas de azul.',
  },
  {
    id: 'acceso',
    titulo: 'Se entra con un QR',
    cuerpo:
      'El garagista escanea el código al ingreso y a la salida. No hay molinetes ni lectores que instalar.',
    movimiento: 'avanza',
    weight: 1.7,
    figura: 'La entrada del garage: un auto llega al portón y, en un detalle ampliado, un celular muestra el código QR de la reserva.',
  },
  {
    id: 'prueba',
    titulo: 'Cada consumo queda registrado',
    cuerpo:
      'Tiempo, tarifa e importe por reserva, con exportación a PDF y Excel. El garage y la empresa ven el mismo detalle.',
    movimiento: 'se apila',
    weight: 1.6,
    tabla: 'consumos',
    figura: 'Sobre cada plaza usada se apila una columna con las horas de estadía.',
  },
  {
    id: 'accion',
    titulo: 'Pedí cocheras para tu equipo',
    cuerpo: 'Creá la cuenta de tu empresa y pedí plazas en los garages de tu zona.',
    movimiento: 'asciende',
    weight: 1,
    cta: true,
    figura: 'La ciudad otra vez desde arriba, ahora con más garages marcados en azul alrededor de la oficina.',
  },
];
