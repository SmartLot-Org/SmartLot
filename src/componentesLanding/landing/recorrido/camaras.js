// Encuadre de cámara por paso del recorrido, en el mismo orden que
// contenido.recorrido.pasos. Unidades de la maqueta: la losa mide 30 × 20 y
// está centrada en el origen; el ingreso queda sobre x = -15.
//
// En horizontal el panel de texto ocupa la parte baja izquierda, por eso el
// objetivo se corre a la izquierda y la maqueta queda a la derecha. En
// vertical el panel va abajo: la cámara se aleja y apunta más abajo para que
// la maqueta quede arriba.
export const ENCUADRES = [
  { posicion: [20.1, 40.6, 56], objetivo: [-7.4, -2.2, 5.9] }, // solicitud: planta completa
  { posicion: [18.6, 24.8, 28], objetivo: [1.7, -1.3, -2.6] }, // trato: las plazas del trato
  { posicion: [5.9, 27.1, 34.3], objetivo: [-12.4, -1.4, 1] }, // reserva: plaza y vehículo en el ingreso
  { posicion: [-0.9, 8.1, 24.1], objetivo: [-14.3, -0.5, 2.6] }, // acceso: la barrera, más bajo
  { posicion: [14.4, 53.2, 49.5], objetivo: [-7.6, -1.8, 6.2] }, // consumo: la planta completa, desde más alto
];

export const ENCUADRES_VERTICAL = [
  { posicion: [47.3, 51.8, 85.9], objetivo: [5, -13.9, 9.1] },
  { posicion: [28.4, 24.2, 34], objetivo: [8.6, -6.5, -2] },
  { posicion: [23.7, 34.1, 53.7], objetivo: [-4.2, -9.2, 3] },
  { posicion: [7, 6.5, 30.1], objetivo: [-10.6, -4.7, 2] },
  { posicion: [39.6, 72.2, 77.8], objetivo: [6, -11.7, 11.9] },
];
