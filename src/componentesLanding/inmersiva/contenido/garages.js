// Contenido de /para-garages: todo el texto de la página y del dibujo vive acá,
// nunca en los componentes. Fuente: PRODUCT.md y docs/specs/SPEC-landing-garages.md.
// Solo cuatro claims (24 meses de historial; tarifas de auto, moto y pickup; 100%
// online, sin hardware; PDF y Excel). Nada de métricas, testimonios, logos ni cuántas
// empresas hay cerca. Los nombres y los importes son ficticios y se rotulan así.
// Lo común a las dos páginas (marca, ingresar, panel, saltar, sin 3D, regla) está en
// contenido/comun.js.

export const META = {
  titulo: 'SmartLot para garages — Aparecé en el mapa de las empresas',
  descripcion:
    'Publicás tu garage y aparecés cuando una empresa busca cocheras cerca de una de sus sedes. Vos aceptás cada pedido y seguís tratos, ocupación y consumos. Sin hardware, sin planillas.',
};

// Una sola acción principal, con la misma etiqueta en el hero, la barra y el cierre.
// Abre el alta de dueño, no la de empresa.
export const CTA = { etiqueta: 'Registrá tu garage', destino: '/register?modo=garage' };

// Tercer nivel: un destino, no una acción. En la barra (escritorio) y en el pie.
export const ENLACE = { etiqueta: 'Para empresas', destino: '/' };

// La frase del pie, como en la home y sin grandilocuencia.
export const PIE = 'Gestión de estacionamientos para empresas y garages.';

const AVISO = 'Datos de ejemplo';

// Pieza de `control`: lo único que el visitante maneja en la página. "Mover a borrador"
// saca el garage de la vista de las empresas y "Restaurar" lo devuelve
// (vistasDueñoGarage/duenio_garage_dashboard.jsx). Sin 3D, cambia el póster.
export const VISIBILIDAD = {
  titulo: 'Tu garage en el mapa de las empresas',
  aviso: AVISO,
  visible: {
    estado: 'Visible',
    texto: 'Aparece cuando una empresa busca garages cerca de su sede.',
    poster: 'control',
    figura: 'La ciudad a media altura: tu garage, visible y en azul, mientras los anillos de búsqueda de las sedes lo alcanzan.',
  },
  borrador: {
    estado: 'En borrador',
    texto: 'No aparece para las empresas. Lo restaurás cuando quieras.',
    poster: 'borrador',
    figura: 'La ciudad a media altura: tu garage, en borrador, vuelve a la línea de trazos y los anillos de búsqueda de las sedes pasan sin encontrarlo.',
  },
};

// weight = alto de la sección en pantallas (cuánto scroll dura); se validan con el 3D.
// piezas = los fragmentos del producto que van en la nota (paginas/garages.js).
export const SECCIONES = [
  {
    id: 'gancho',
    titulo: 'Aparecé en el mapa de las empresas',
    cuerpo:
      'Publicás tu garage, las empresas piden lugar para su gente y vos manejás tratos, ocupación y consumos. Sin hardware, sin planillas.',
    movimiento: 'rastrea',
    weight: 1,
    cta: true,
    figura: 'Plano de una zona de la ciudad: cuatro sedes de empresas marcadas en tinta, dos garages con el cartel de estacionamiento y tu garage en línea de trazos, todavía fuera del mapa.',
  },
  {
    id: 'problema',
    titulo: 'Plazas libres que nadie encuentra',
    cuerpo:
      'Mientras las empresas de la zona no encuentran dónde estacionar, tus cocheras vacías no generan nada. Y lo que se arregla por WhatsApp o en papel no queda registrado.',
    movimiento: 'orbita',
    weight: 1.1,
    figura: 'La manzana de una sede: autos que dan vueltas sin encontrar lugar y, a 300 metros, tu garage sin cartel, rodeado por los globos de un chat que no para.',
  },
  {
    id: 'alta',
    titulo: 'Tu garage, con tus horarios y precios',
    cuerpo:
      'Marcás la ubicación en el mapa, los días y el horario, cuántas plazas destinás a reservas y tus tarifas por hora para auto, moto y pickup.',
    movimiento: 'se dibuja',
    weight: 1.3,
    figura: 'Tu garage de cerca: el volumen se dibuja arista por arista y aparecen sus cotas, con la ubicación, el horario, las plazas y las tarifas.',
  },
  {
    id: 'mapa',
    titulo: 'Las empresas cercanas te encuentran',
    cuerpo:
      'Cuando una empresa busca garages cerca de una de sus sedes, ve el tuyo en el mapa con la distancia, las plazas disponibles, tus horarios y tus tarifas. Desde ahí te pide cocheras.',
    movimiento: 'asciende',
    weight: 1.6,
    piezas: ['busqueda'],
    figura: 'La ciudad desde más arriba: tu garage pasa a azul con el cartel de estacionamiento y, cuando el anillo de búsqueda de una sede lo alcanza, sobre esa sede aparece la distancia por la calle.',
  },
  {
    id: 'trato',
    titulo: 'Vos aceptás o rechazás cada pedido',
    cuerpo:
      'Ves qué empresa pide, para qué sede, cuántas cocheras y si las paga la empresa o el empleado. Nada se activa sin tu confirmación, tampoco un cambio en la cantidad de cocheras.',
    movimiento: 'se traza',
    weight: 1.3,
    figura: 'Una línea azul recorre los 300 metros de calle desde una sede hasta tu garage; al lado, la solicitud de la empresa pasa de pendiente a trato aceptado y el techo del garage se pinta de azul.',
  },
  {
    id: 'operacion',
    titulo: 'El detalle, reserva por reserva',
    cuerpo:
      'Todo es 100% online: la ocupación la mueven las reservas y los ingresos con QR, nunca una carga a mano. Cada consumo queda con su tiempo, tarifa e importe, con 24 meses de historial y exportación a PDF y Excel.',
    movimiento: 'se llena',
    weight: 1.4,
    piezas: ['consumos'],
    figura: 'Tu garage sin techo: las plazas del trato se pintan de azul a medida que se reservan y sobre cada una se apila una columna con sus horas de uso.',
  },
  {
    id: 'control',
    titulo: 'Vos decidís cuándo aparecés',
    cuerpo:
      'Si pasás un garage a borrador, deja de aparecer para las empresas, y lo restaurás cuando quieras. Cada dueño ve solo sus garages.',
    movimiento: 'alterna',
    weight: 1.2,
    piezas: ['visibilidad'],
    // Sin 3D, el interruptor muestra el póster del estado elegido (VISIBILIDAD).
    figura: VISIBILIDAD.visible.figura,
  },
  {
    id: 'accion',
    titulo: 'Sumá tu garage al mapa',
    cuerpo: 'Creá tu cuenta de dueño, cargá tu garage y empezá a recibir pedidos de empresas.',
    movimiento: 'converge',
    weight: 1,
    cta: true,
    figura: 'La ciudad entera desde arriba: desde cada sede, una ruta punteada llega hasta tu garage, marcado en azul.',
  },
];

// Pieza de `mapa`: la tarjeta del listado de "Buscar garages" (vistasAdmin/gestion_garages.jsx),
// con tus datos. La distancia es la de la cota de 300 m del dibujo.
export const BUSQUEDA = {
  titulo: 'Así te ve una empresa',
  aviso: AVISO,
  distancia: '0,3 km · 2 min',
  nombre: 'Tu garage',
  horario: '08:00 a 20:00 · Lun, Mar, Mié, Jue, Vie, Sáb',
  disponibles: '25 de 40 disponibles',
  tarifas: 'Auto $ 1.200 · Moto $ 600 · Pickup $ 1.500',
  boton: 'Solicitar cocheras',
};

// Pieza de `operacion`: las columnas de "Consumos por empresa" de la pantalla del dueño
// (vistasDueñoGarage/cuentas_por_cobrar.jsx). Las tres filas van con la tarifa de auto,
// así el tiempo por la tarifa da el importe; las filas suman el total. Los nombres son
// cortos a propósito: en 390 px cada fila entra en un renglón y la nota no tapa el dibujo.
export const CONSUMOS = {
  titulo: 'Consumos por empresa',
  aviso: AVISO,
  columnas: ['Empresa', 'Reservas', 'Tiempo', 'Importe generado'],
  tarifa: '$ 1.200/h',
  filas: [
    { empresa: 'Grupo Norte', reservas: 18, tiempo: '142 h 30 min', importe: '$ 171.000' },
    { empresa: 'Estudio Sur', reservas: 9, tiempo: '64 h 15 min', importe: '$ 77.100' },
    { empresa: 'Delta Salud', reservas: 6, tiempo: '40 h 45 min', importe: '$ 48.900' },
  ],
  total: { etiqueta: 'Total', reservas: 33, tiempo: '247 h 30 min', importe: '$ 297.000' },
  // La pantalla real lo aclara igual: son consumos generados, no confirman cobros.
  pie: 'Son consumos generados, no cobros. Se exportan a PDF y Excel.',
};

// Capa del dibujo en `trato` (decorativa, aria-hidden): la tarjeta de una solicitud como
// la ve el dueño en /duenio-garage/tratos (GestionTratosGarage.jsx), que pasa de
// pendiente a aceptada con el scroll. La empresa es la primera fila de los consumos.
export const SOLICITUD = {
  aviso: AVISO,
  empresa: 'Grupo Norte',
  estado: { pendiente: 'Pendiente', aceptado: 'Trato aceptado' },
  garage: { etiqueta: 'Garage solicitado', nombre: 'Tu garage' },
  sede: 'Sede Centro',
  cocheras: 12,
  detalle: 'cocheras solicitadas · cubre la empresa',
  acciones: { aceptar: 'Aceptar trato', rechazar: 'Rechazar' },
};

// Globos del chat en `problema` (decorativos, ficticios): así se arregla hoy desde el
// garage, por chat y de palabra, con las mismas empresas de los consumos. "Vos" es el dueño.
export const CHAT = [
  { de: 'Grupo Norte', texto: '¿Tenés lugar para cinco autos desde el lunes?' },
  { de: 'Vos', texto: 'Creo que sí, pasá y lo vemos' },
  { de: 'Estudio Sur', texto: '¿Cuántas cocheras habíamos quedado?' },
  { de: 'Vos', texto: 'Lo anoté en un papel, ya lo busco' },
  { de: 'Grupo Norte', texto: '¿Cuántas horas usamos este mes?' },
  { de: 'Vos', texto: 'Te paso la planilla cuando la termine' },
  { de: 'Delta Salud', texto: 'Hoy mandamos dos autos más, ¿hay lugar?' },
  { de: 'Vos', texto: 'Avisame antes, que se llena' },
];

// Rótulos y cotas del dibujo (decorativos: el contenido real está en las secciones).
// Las distancias de cada sede salen del mundo (metros por la calle) con la unidad de acá;
// la del pedido es la de 300 m, la misma de la ficha de la búsqueda.
export const ROTULOS = {
  sede: 'Sede',
  garage: 'Tu garage',
  senal: 'E',
  // Cotas del alta, en el orden en que se dibujan.
  alta: {
    ubicacion: 'Ubicación en el mapa',
    horario: '08:00 a 20:00 · Lun a Sáb',
    plazas: '40 plazas · 25 para reservas',
    tarifas: 'Auto $ 1.200 · Moto $ 600 · Pickup $ 1.500 por hora',
  },
  distancia: { trato: '300 m', unidad: 'm' },
};
