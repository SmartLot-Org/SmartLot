// Estado continuo del recorrido. Lo escribe solo el ScrollTrigger de
// Recorrido.jsx y lo lee la escena en useFrame: nunca pasa por React, así el
// scroll no re-renderiza nada en cada frame y la capa DOM no necesita
// importar three para hablar con la escena.
export const rigRecorrido = {
  // 0..1 mientras el escenario está fijo (de "top top" a "bottom bottom").
  progreso: 0,
  // 0..1 mientras la sección entra al viewport, antes de fijarse.
  entrada: 0,
};
