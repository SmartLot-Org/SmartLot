// Guion técnico de /para-garages: qué encuadre y qué estado del dibujo le toca a cada
// sección, con el mismo vocabulario de fx que la home (FX_CERO, en coreografia.js).
// Es la misma ciudad vista desde el otro lado del trato: arranca en el mapa con tu
// garage afuera, baja a la cuadra del problema, sube para mostrar quién lo encuentra y
// cómo lo ve, y cierra con la ciudad entera apuntando a tu garage.
//
// Como en la home, `desde` y `hasta` se miden en pantallas de scroll desde que la
// sección asoma por abajo: de 0 a 1 es la entrada (viaja la cámara) y de 1 a `weight`,
// la estadía. Los weight están en contenido/garages.js.
//
// Los encuadres dejan el dibujo en la parte libre de la pantalla: a la derecha de la
// nota en horizontal y arriba de ella en vertical, con la altura de cada nota en 390 px
// (en el mapa y la operación la nota lleva su pieza y ocupa más). En vertical la cámara
// abre más, porque la pantalla es angosta.

// Al cargar: tu garage está fuera del mapa y las sedes ya están marcadas.
export const INICIAL_GARAGES = Object.freeze({ fuera: 1, sedes: 1 });

export const COREOGRAFIA_GARAGES = {
  // El mapa: cuatro sedes en tinta, los dos garages con el cartel E y el tuyo en línea
  // de trazos. De cada sede sale, lento, un anillo de búsqueda.
  gancho: {
    camara: { x: 17.06, z: 2.48, zoom: 1.05 },
    camaraVertical: { x: 19.78, z: 5.53, zoom: 0.56 },
    fx: [],
  },
  // La cuadra de una sede: autos que dan vueltas y, a 300 m, tu garage con el chat.
  problema: {
    camara: { x: 9.65, z: -5.75, zoom: 2.2 },
    camaraVertical: { x: 19.57, z: 13.13, zoom: 1 },
    fx: [
      { clave: 'vueltas', valor: 1, desde: 0.3, hasta: 0.95 },
    ],
  },
  // El único momento audaz. En la entrada la cámara sube, tu garage pasa a azul señal con
  // el cartel E y los anillos de las sedes lo alcanzan. Al llegar a la estadía, con la
  // nota quieta, una flecha corta sube desde tu garage y la tarjeta de la búsqueda
  // (three/FichaMapa.jsx) entra enseguida (el fx arranca en 0,8 porque el dibujo
  // amortiguado llega un poco después que el scroll): lo que la empresa ve de vos, que son los datos
  // del alta. Queda fija toda la estadía y se va recién en `trato`.
  mapa: {
    camara: { x: 15.56, z: 1.11, zoom: 1.02 },
    camaraVertical: { x: 8.27, z: -5.98, zoom: 0.56 },
    fx: [
      { clave: 'vueltas', valor: 0, desde: 0, hasta: 0.45 },
      { clave: 'fuera', valor: 0, desde: 0.3, hasta: 0.55 },
      { clave: 'busqueda', valor: 1, desde: 0.5, hasta: 0.8 },
      { clave: 'ficha', valor: 1, desde: 0.8, hasta: 0.95 },
    ],
  },
  // El pedido: la flecha y la tarjeta se van antes de que salga la línea, la búsqueda
  // se guarda, la línea azul recorre los 300 m desde la sede y, con la solicitud
  // aceptada, el techo se pinta (regla 5).
  trato: {
    camara: { x: 10.18, z: -1.44, zoom: 2.81 },
    camaraVertical: { x: 23.26, z: 15.75, zoom: 2.3 },
    fx: [
      { clave: 'ficha', valor: 0, desde: 0, hasta: 0.2 },
      { clave: 'busqueda', valor: 0, desde: 0, hasta: 0.4 },
      { clave: 'traza', valor: 1, desde: 0.4, hasta: 1 },
      { clave: 'trato', valor: 1, desde: 1.05, hasta: 1.25 },
    ],
  },
  // Se levanta el techo: las plazas del trato se pintan con las reservas (regla 4) y
  // sobre cada una se apilan sus horas de uso.
  operacion: {
    camara: { x: 22.14, z: 10.6, zoom: 9.6 },
    camaraVertical: { x: 26.03, z: 14.03, zoom: 4.05 },
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
    camara: { x: 1.26, z: 8.91, zoom: 1.8 },
    camaraVertical: { x: 7.43, z: 12.63, zoom: 1.04 },
    fx: [
      { clave: 'consumos', valor: 0, desde: 0, hasta: 0.3 },
      { clave: 'tapa', valor: 0, desde: 0.15, hasta: 0.55 },
      { clave: 'busqueda', valor: 1, desde: 0.55, hasta: 1.1 },
    ],
  },
  // La ciudad entera: desde cada sede, una ruta punteada llega hasta tu garage y el logo
  // de SmartLot sube sobre él, como en el cierre de la home sobre la oficina (mismo fx y
  // mismo tramo, escena Logo.jsx).
  accion: {
    camara: { x: 15.28, z: 0.99, zoom: 0.98 },
    camaraVertical: { x: 9.52, z: -4.73, zoom: 0.56 },
    fx: [
      { clave: 'llegan', valor: 1, desde: 0.3, hasta: 0.9 },
      { clave: 'logo', valor: 1, desde: 0.45, hasta: 0.8 },
    ],
  },
};
