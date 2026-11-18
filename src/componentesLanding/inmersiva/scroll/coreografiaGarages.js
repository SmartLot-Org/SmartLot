// Guion técnico de /para-garages: qué encuadre y qué estado del dibujo le toca a cada
// sección, con el mismo vocabulario de fx que la home (FX_CERO, en coreografia.js).
// Es la misma ciudad vista desde el otro lado del trato: arranca en el mapa con tu
// garage afuera, baja para dibujarlo, sube para mostrar quién lo encuentra y cierra con
// la ciudad entera apuntando a tu garage.
//
// Como en la home, `desde` y `hasta` se miden en pantallas de scroll desde que la
// sección asoma por abajo: de 0 a 1 es la entrada (viaja la cámara) y de 1 a `weight`,
// la estadía. Los weight están en contenido/garages.js.

// Al cargar: tu garage está fuera del mapa y las sedes ya están marcadas.
export const INICIAL_GARAGES = Object.freeze({ fuera: 1, sedes: 1 });

export const COREOGRAFIA_GARAGES = {
  // El mapa: cuatro sedes en tinta, los dos garages con el cartel E y el tuyo en línea
  // de trazos. De cada sede sale, lento, un anillo de búsqueda.
  gancho: {
    camara: { x: 27, z: 13, zoom: 1.15 },
    camaraVertical: { x: 28, z: 14, zoom: 0.72 },
    fx: [],
  },
  // La cuadra de una sede: autos que dan vueltas y, a 300 m, tu garage con el chat.
  problema: {
    camara: { x: 11, z: 5, zoom: 2.3 },
    camaraVertical: { x: 12, z: 6, zoom: 1.6 },
    fx: [
      { clave: 'vueltas', valor: 1, desde: 0.3, hasta: 0.95 },
    ],
  },
  // Tu garage de cerca: el volumen se dibuja y aparecen las cotas del alta.
  alta: {
    camara: { x: 24.3, z: 11.6, zoom: 5.2 },
    camaraVertical: { x: 24, z: 12, zoom: 3.4 },
    fx: [
      { clave: 'vueltas', valor: 0, desde: 0, hasta: 0.45 },
      { clave: 'alta', valor: 1, desde: 0.45, hasta: 1.25 },
    ],
  },
  // El único momento audaz: la cámara sube, tu garage pasa a azul señal con el cartel E
  // y los anillos de las sedes lo alcanzan. Las aristas del alta se borran recién
  // cuando ya no se ven (fuera en 0), así el relato vuelve igual hacia atrás.
  mapa: {
    camara: { x: 28, z: 13, zoom: 1.05 },
    camaraVertical: { x: 28, z: 14, zoom: 0.66 },
    fx: [
      { clave: 'fuera', valor: 0, desde: 0.55, hasta: 0.85 },
      { clave: 'busqueda', valor: 1, desde: 0.85, hasta: 1.5 },
      { clave: 'alta', valor: 0, desde: 0.9, hasta: 1.05 },
    ],
  },
  // El pedido: la búsqueda se guarda, la línea azul recorre los 300 m desde la sede y,
  // con la solicitud aceptada, el techo se pinta (regla 5).
  trato: {
    camara: { x: 13.5, z: 6.5, zoom: 2.8 },
    camaraVertical: { x: 12, z: 6, zoom: 1.85 },
    fx: [
      { clave: 'busqueda', valor: 0, desde: 0, hasta: 0.4 },
      { clave: 'traza', valor: 1, desde: 0.4, hasta: 1 },
      { clave: 'trato', valor: 1, desde: 1.05, hasta: 1.25 },
    ],
  },
  // Se levanta el techo: las plazas del trato se pintan con las reservas (regla 4) y
  // sobre cada una se apilan sus horas de uso.
  operacion: {
    camara: { x: 24.2, z: 12.2, zoom: 9.6 },
    camaraVertical: { x: 24.1, z: 12.2, zoom: 5 },
    fx: [
      { clave: 'tapa', valor: 1, desde: 0.45, hasta: 0.9 },
      { clave: 'llenas', valor: 1, desde: 0.8, hasta: 1.15 },
      { clave: 'consumos', valor: 1, desde: 1.05, hasta: 1.38 },
    ],
  },
  // La ciudad a media altura: vuelve el techo y los anillos encuentran otra vez tu
  // garage. El interruptor (ajustesGarages.js) lo saca del mapa mientras dure "En
  // borrador" (regla 6).
  control: {
    camara: { x: 24, z: 10, zoom: 1.9 },
    camaraVertical: { x: 22, z: 10, zoom: 1.25 },
    fx: [
      { clave: 'consumos', valor: 0, desde: 0, hasta: 0.3 },
      { clave: 'tapa', valor: 0, desde: 0.15, hasta: 0.55 },
      { clave: 'busqueda', valor: 1, desde: 0.55, hasta: 1.1 },
    ],
  },
  // La ciudad entera: desde cada sede, una ruta punteada llega hasta tu garage.
  accion: {
    camara: { x: 30, z: 14, zoom: 0.95 },
    camaraVertical: { x: 28, z: 14, zoom: 0.62 },
    fx: [
      { clave: 'llegan', valor: 1, desde: 0.3, hasta: 0.9 },
    ],
  },
};
