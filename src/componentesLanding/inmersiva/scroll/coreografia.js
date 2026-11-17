// Guion técnico: qué encuadre y qué estado del dibujo le toca a cada sección.
// 1 unidad del mundo = 10 metros. La cámara mira siempre desde la misma dirección
// (axonométrica); solo cambian el punto del suelo que encuadra (x, z) y el zoom.
//
// Cada fx dice a qué valor llega una clave y en qué tramo de la sección lo hace.
// `desde` y `hasta` se miden en pantallas de scroll desde que la sección asoma
// por abajo: de 0 a 1 es la entrada (viaja la cámara) y de 1 a `weight`, la estadía.

export const FX_CERO = Object.freeze({
  vueltas: 0,   // autos dando vueltas a la manzana
  traza: 0,     // recorrido oficina → garage
  trato: 0,     // el garage acepta: su techo se pinta
  tapa: 0,      // se levanta el techo y se ve la planta
  llenas: 0,    // plazas del trato reservadas
  acceso: 0,    // detalle de la entrada (auto, garagista, celular)
  ingreso: 0,   // el auto avanza y se escanea el QR
  consumos: 0,  // horas apiladas sobre cada plaza
  red: 0,       // más garages marcados
  pinFuera: 0,  // el pin del hero se guarda (vuelve en el cierre)
});

export const COREOGRAFIA = {
  gancho: {
    camara: { x: 6, z: 0, zoom: 1 },
    camaraVertical: { x: 4, z: 2, zoom: 0.78 },
    fx: [],
  },
  problema: {
    camara: { x: 2.4, z: 1.2, zoom: 2.9 },
    camaraVertical: { x: 0.6, z: 0.6, zoom: 2.3 },
    fx: [
      { clave: 'pinFuera', valor: 1, desde: 0, hasta: 0.6 },
      { clave: 'vueltas', valor: 1, desde: 0.3, hasta: 0.95 },
    ],
  },
  idea: {
    camara: { x: 13.5, z: 6.5, zoom: 2.8 },
    camaraVertical: { x: 12, z: 6, zoom: 1.85 },
    fx: [
      { clave: 'vueltas', valor: 0, desde: 0, hasta: 0.45 },
      { clave: 'traza', valor: 1, desde: 0.5, hasta: 1.35 },
      { clave: 'trato', valor: 1, desde: 1.3, hasta: 1.52 },
    ],
  },
  reserva: {
    camara: { x: 24, z: 12, zoom: 9.6 },
    camaraVertical: { x: 24, z: 12, zoom: 5.2 },
    fx: [
      { clave: 'tapa', valor: 1, desde: 0.5, hasta: 1 },
      { clave: 'llenas', valor: 1, desde: 1, hasta: 1.52 },
    ],
  },
  acceso: {
    camara: { x: 23.9, z: 8.08, zoom: 68 },
    camaraVertical: { x: 23.62, z: 7.7, zoom: 38 },
    fx: [
      { clave: 'acceso', valor: 1, desde: 0.45, hasta: 0.9 },
      { clave: 'ingreso', valor: 1, desde: 0.8, hasta: 1.62 },
    ],
  },
  prueba: {
    camara: { x: 24.3, z: 12.3, zoom: 8.4 },
    camaraVertical: { x: 24.1, z: 12.2, zoom: 4.8 },
    fx: [
      { clave: 'acceso', valor: 0, desde: 0, hasta: 0.35 },
      { clave: 'consumos', valor: 1, desde: 0.8, hasta: 1.52 },
    ],
  },
  accion: {
    camara: { x: 6, z: -3, zoom: 0.95 },
    camaraVertical: { x: 4, z: 0, zoom: 0.74 },
    fx: [
      { clave: 'consumos', valor: 0, desde: 0, hasta: 0.35 },
      { clave: 'tapa', valor: 0, desde: 0.2, hasta: 0.6 },
      { clave: 'red', valor: 1, desde: 0.55, hasta: 1 },
      { clave: 'pinFuera', valor: 0, desde: 0.5, hasta: 1 },
    ],
  },
};
