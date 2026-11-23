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
  secundaria: { etiqueta: 'Para garages', destino: '/para-garages' },
};

export const NAVEGACION = {
  marca: 'SmartLot',
  ingresar: { etiqueta: 'Iniciar sesión', destino: '/login' },
  panel: 'Ir a mi panel',
  saltar: 'Saltar al contenido',
  sin3d: { activar: 'Ver sin 3D', desactivar: 'Volver al 3D' },
  regla: 'Recorrido de la página',
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

// Cajetín de la intro: el rótulo de un plano técnico.
export const INTRO = {
  titulo: 'SmartLot',
  filas: [
    ['Plano', 'N.º 1 · Cocheras cerca de la oficina'],
    ['Escala', '1:5000'],
    ['Hoja', '1 de 8'],
  ],
};

// Deslizador antes / con SmartLot (en el problema) y los chats del "antes".
export const COMPARAR = {
  etiqueta: 'Comparar cómo es hoy y cómo es con SmartLot',
  antes: 'Hoy',
  despues: 'Con SmartLot',
  ayuda: 'Deslizá para comparar',
  // Ficticios: así se arregla hoy, por chat y de palabra.
  chats: [
    { de: 'Equipo', texto: '¿Queda lugar en la cochera hoy?' },
    { de: 'Garage', texto: 'Creo que sí, fijate cuando llegues' },
    { de: 'Equipo', texto: 'Di tres vueltas y nada…' },
    { de: 'RR. HH.', texto: '¿Quién usó la plaza 14 ayer?' },
    { de: 'Garage', texto: 'Hoy no hay lugar, mañana veo' },
    { de: 'Equipo', texto: 'Me ocuparon el lugar otra vez' },
    { de: 'Administración', texto: '¿Alguien tiene la planilla de cocheras?' },
    { de: 'Garage', texto: 'Este mes se cobra distinto' },
    { de: 'Equipo', texto: '¿A quién le aviso que llego tarde?' },
    { de: 'Administración', texto: 'No me cierran las horas del garage' },
  ],
};

// Celular que acompaña a la reserva (pantalla de ejemplo de la app).
export const CELULAR = {
  titulo: 'Reservar plaza',
  sede: 'Sede Centro',
  dias: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
  horario: '08:30 – 18:00',
  boton: 'Reservar',
  hecho: 'Reservada',
  plaza: 'Plaza',
  plazas: ['14', '08', '21', '14', '05'],  // las mismas de la tabla de consumos
};

// Fichas de los garages del plano (datos de ejemplo, así se rotulan).
export const GARAGES_DEMO = {
  aviso: 'Datos de ejemplo',
  libres: 'plazas libres',
  desde: 'de tu oficina',
  ver: 'Ver garage',
  lista: [
    { nombre: 'Garage del trato', libres: 25 },
    { nombre: 'Garage Pasaje Norte', libres: 12 },
    { nombre: 'Garage Las Tipas', libres: 8 },
    { nombre: 'Garage Plaza Central', libres: 18 },
    { nombre: 'Garage del Puerto', libres: 6 },
    { nombre: 'Garage Oeste', libres: 14 },
    { nombre: 'Garage Molinos', libres: 9 },
  ],
};

// Selector de día de la reserva: muestra en el celular y en la planta la
// plaza de ese día (las mismas del celular y de la tabla de consumos).
export const ELEGIR = {
  titulo: 'Elegí un día',
  ayuda: 'Tocá un día para ver qué plaza te toca',
  etiqueta: 'Día de la reserva',
};

// Reloj de la jornada (decorativo): de la entrada a la salida del equipo.
export const JORNADA = { desde: 7, hasta: 20, ocupadas: 'ocupadas' };

// Mira del cursor: la cota del edificio apuntado.
export const MIRA = { edificio: 'Edificio', alto: 'alto' };

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
    comparador: true,
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
    elegirDia: true,
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
    id: 'jornada',
    titulo: 'Toda la jornada, a la vista',
    cuerpo:
      'Cada ingreso y salida se registra con el QR. La empresa y el garage saben qué plazas se usan en cada momento.',
    movimiento: 'transcurre',
    weight: 1.7,
    poster: 'accion',
    figura: 'La ciudad desde arriba con la oficina en el centro y los garages de la zona marcados en azul alrededor.',
  },
  {
    id: 'accion',
    titulo: 'Pedí cocheras para tu equipo',
    cuerpo: 'Creá la cuenta de tu empresa y pedí plazas en los garages de tu zona.',
    movimiento: 'asciende',
    weight: 1,
    cta: true,
    figura: 'La ciudad otra vez desde arriba, ahora con más garages marcados en azul alrededor de la oficina y el logo de SmartLot flotando sobre ella.',
  },
];
