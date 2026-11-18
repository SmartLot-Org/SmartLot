// En qué momento de la búsqueda (fx.busqueda, de 0 a 1) el anillo de cada sede alcanza
// tu garage: de 0 (sale de la sede) a 1 (llegó). Las sedes arrancan escalonadas y se
// pisan un poco, así se lee una búsqueda por sede y no un solo gesto. Lo usan los
// anillos (escenas/Busqueda.jsx) y la cota de distancia de cada sede (rotulosGarages.js).
const ESCALON = 0.18;
const TRAMO = 0.46;   // 3 escalones + un tramo = 1: la última sede llega justo al final

export const hallazgo = (busqueda, i) => {
  const t = (busqueda - i * ESCALON) / TRAMO;
  return t < 0 ? 0 : t > 1 ? 1 : t;
};
