// El mundo del plano, generado por código: solo datos (arrays de posiciones),
// sin three. 1 unidad = 10 metros; el suelo es el plano XZ.
// Todo es determinista (semillas fijas): el dibujo es el mismo en cada visita.

export function azar(semilla) {
  return function () {
    semilla |= 0; semilla = (semilla + 0x6D2B79F5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Constructores: empujan triángulos (caras) o segmentos (aristas) ──────────
export function caja(caras, aristas, x0, z0, x1, z1, h, y0 = 0) {
  const v = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1]];
  if (caras) {
    for (const f of [[4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]) {
      for (const i of [0, 1, 2, 0, 2, 3]) caras.push(...v[f[i]]);
    }
  }
  if (aristas) {
    for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) {
      aristas.push(...v[a], ...v[b]);
    }
  }
}
export function rectangulo(lineas, x0, z0, x1, z1, y) {
  lineas.push(x0, y, z0, x1, y, z0, x1, y, z0, x1, y, z1, x1, y, z1, x0, y, z1, x0, y, z1, x0, y, z0);
}
export function cuadro(caras, x0, z0, x1, z1, y) {
  caras.push(x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z0, x1, y, z1, x0, y, z1);
}
function prisma(caras, aristas, cx, cz, r, y0, y1, lados = 6) {
  const p = [];
  for (let i = 0; i < lados; i++) {
    const a = (i / lados) * Math.PI * 2 + Math.PI / lados;
    p.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
  }
  for (let i = 0; i < lados; i++) {
    const [ax, az] = p[i];
    const [bx, bz] = p[(i + 1) % lados];
    caras.push(ax, y0, az, bx, y0, bz, bx, y1, bz, ax, y0, az, bx, y1, bz, ax, y1, az);
    caras.push(cx, y1, cz, ax, y1, az, bx, y1, bz);
    aristas.push(ax, y0, az, bx, y0, bz, ax, y1, az, bx, y1, bz, ax, y0, az, ax, y1, az);
  }
}

// ── La ciudad ────────────────────────────────────────────────────────────────
export const PASO = 12;   // manzana de 100 m + calle de 20 m
const RADIO = 8;          // manzanas hacia cada lado de la oficina

export const OFICINA = { x0: -2.2, z0: -2.2, x1: 2.2, z1: 2.2, h: 8.4 };
export const G1 = { x0: 22, z0: 8.5, x1: 26, z1: 15.5, h: 2.2 };          // el garage del trato
export const G2 = { x0: -26, z0: -27.5, x1: -22, z1: -20.5, h: 2.2 };
export const G3 = { x0: 34, z0: -27.5, x1: 38, z1: -20.5, h: 2.2 };
// Garages que se suman a la red en el cierre.
export const SUMADOS = [
  { x0: -14, z0: 20.5, x1: -10, z1: 27.5, h: 2.2 },
  { x0: 10, z0: -39.5, x1: 14, z1: -32.5, h: 2.2 },
  { x0: -38, z0: -3.5, x1: -34, z1: 3.5, h: 2.2 },
  { x0: 46, z0: 8.5, x1: 50, z1: 15.5, h: 2.2 },
];
const manzanaDe = (g) => `${Math.round((g.x0 + g.x1) / 2 / PASO)},${Math.round((g.z0 + g.z1) / 2 / PASO)}`;

function construirCiudad() {
  const especiales = new Set(['0,0', ...[G1, G2, G3, ...SUMADOS].map(manzanaDe)]);
  // Manzanas delante de cada especial (hacia la cámara): quedan bajas para no taparlo.
  const bajas = new Set();
  for (const clave of especiales) {
    const [c, r] = clave.split(',').map(Number);
    for (const [dc, dr] of [[1, 0], [0, 1], [1, 1]]) bajas.add(`${c + dc},${r + dr}`);
  }

  const rng = azar(11);
  const manzanas = [];
  const edificios = [];
  for (let c = -RADIO; c <= RADIO; c++) {
    for (let r = -RADIO; r <= RADIO; r++) {
      const clave = `${c},${r}`;
      const ox = c * PASO - 5;
      const oz = r * PASO - 5;
      rectangulo(manzanas, ox, oz, ox + 10, oz + 10, 0);
      if (especiales.has(clave)) continue;
      const baja = bajas.has(clave);
      const tope = baja ? 1.3 : 7.5;
      const patron = rng();
      if (patron < 0.1) continue;      // plaza: manzana libre
      const lotes = patron < 0.4 ? [[0.8, 0.8, 9.2, 9.2]]
        : patron < 0.7 ? (rng() < 0.5 ? [[0.8, 0.8, 4.7, 9.2], [5.3, 0.8, 9.2, 9.2]] : [[0.8, 0.8, 9.2, 4.7], [0.8, 5.3, 9.2, 9.2]])
        : [[0.8, 0.8, 4.7, 4.7], [5.3, 0.8, 9.2, 4.7], [0.8, 5.3, 4.7, 9.2], [5.3, 5.3, 9.2, 9.2]];
      for (const l of lotes) {
        let alto = 0.9 + rng() * (tope - 0.9);
        if (!baja && rng() < 0.12) alto += 4;
        const cx = ox + (l[0] + l[2]) / 2;
        const cz = oz + (l[1] + l[3]) / 2;
        edificios.push({ x0: ox + l[0], z0: oz + l[1], x1: ox + l[2], z1: oz + l[3], h: alto, d: Math.hypot(cx, cz) });
      }
    }
  }
  edificios.sort((a, b) => a.d - b.d);   // el dibujo avanza desde la oficina hacia afuera
  const caras = [];
  const cerca = [];
  const lejos = [];
  for (const e of edificios) caja(caras, e.d < 46 ? cerca : lejos, e.x0, e.z0, e.x1, e.z1, e.h);
  return { manzanas, caras, cerca, lejos, edificios };
}

function construirHitos() {
  const oficina = { caras: [], aristas: [] };
  caja(oficina.caras, oficina.aristas, OFICINA.x0, OFICINA.z0, OFICINA.x1, OFICINA.z1, OFICINA.h);
  for (let piso = 1.2; piso < OFICINA.h - 0.3; piso += 1.2) {
    rectangulo(oficina.aristas, OFICINA.x0, OFICINA.z0, OFICINA.x1, OFICINA.z1, piso);
  }
  const grupo = (lista) => {
    const g = { caras: [], aristas: [], techos: [] };
    for (const e of lista) {
      caja(g.caras, g.aristas, e.x0, e.z0, e.x1, e.z1, e.h);
      cuadro(g.techos, e.x0, e.z0, e.x1, e.z1, e.h + 0.02);
    }
    return g;
  };
  return { oficina, trato: grupo([G1]), otros: grupo([G2, G3]), sumados: grupo(SUMADOS) };
}

// ── El recorrido del trato: de la puerta de la oficina a la entrada del garage ──
export const RUTA = [[OFICINA.x1, 0], [6, 0], [6, 6], [24, 6], [24, G1.z0]];
function construirRuta() {
  const ANCHO = 0.36;
  const cinta = [];
  let largo = 0;
  for (let s = 0; s < RUTA.length - 1; s++) {
    const a = RUTA[s];
    const b = RUTA[s + 1];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const ux = dx / len;
    const uz = dz / len;
    largo += len;
    const ini = s ? -ANCHO / 2 : 0;
    const fin = len + (s < RUTA.length - 2 ? ANCHO / 2 : 0);
    const pasos = Math.ceil((fin - ini) / 0.4);
    const nx = (-uz * ANCHO) / 2;
    const nz = (ux * ANCHO) / 2;
    for (let i = 0; i < pasos; i++) {
      const t0 = ini + ((fin - ini) * i) / pasos;
      const t1 = ini + ((fin - ini) * (i + 1)) / pasos;
      const p0x = a[0] + ux * t0, p0z = a[1] + uz * t0, p1x = a[0] + ux * t1, p1z = a[1] + uz * t1;
      cinta.push(p0x + nx, 0.06, p0z + nz, p0x - nx, 0.06, p0z - nz, p1x - nx, 0.06, p1z - nz,
        p0x + nx, 0.06, p0z + nz, p1x - nx, 0.06, p1z - nz, p1x + nx, 0.06, p1z + nz);
    }
  }
  return { cinta, metros: Math.round(largo) * 10 };
}

// ── La planta del garage: cuatro filas de plazas de 2,5 × 5 m y dos calles ──
export const PORTON = { x0: 23.7, x1: 24.3, z: G1.z0 };
export const RESERVADAS = 25;
const COLUMNAS = [[22.4, 22.9], [23.5, 24.0], [24.0, 24.5], [25.1, 25.6]];
const PLAZAS_POR_FILA = 24;

function construirPlanta() {
  const Y = 0.02;
  const lineas = [];
  const muro = [];
  // Muro perimetral con el vano del portón sobre la calle.
  const { x0, z0, x1, z1 } = G1;
  const G = 0.035;
  for (const d of [0, G]) {
    muro.push(x0 + d, Y, z0 + d, PORTON.x0, Y, z0 + d, PORTON.x1, Y, z0 + d, x1 - d, Y, z0 + d);
    muro.push(x1 - d, Y, z0 + d, x1 - d, Y, z1 - d, x1 - d, Y, z1 - d, x0 + d, Y, z1 - d, x0 + d, Y, z1 - d, x0 + d, Y, z0 + d);
  }
  muro.push(PORTON.x0, Y, z0, PORTON.x0, Y, z0 + G, PORTON.x1, Y, z0, PORTON.x1, Y, z0 + G);
  // Acceso vehicular: de la línea municipal (borde de la manzana) al portón.
  const LM = z0 - 1.5;
  muro.push(PORTON.x0, Y, LM, PORTON.x0, Y, z0, PORTON.x1, Y, LM, PORTON.x1, Y, z0);

  const plazas = [];
  for (const [c0, c1] of COLUMNAS) {
    rectangulo(lineas, c0, 9, c1, 15, Y);
    for (let k = 0; k < PLAZAS_POR_FILA; k++) {
      const z = 9 + k * 0.25;
      if (k) lineas.push(c0, Y, z, c1, Y, z);
      plazas.push([c0, z, c1, z + 0.25]);
    }
  }
  // Flechas de circulación en las dos calles internas.
  const flechas = [];
  for (const [x, sentido] of [[23.2, 1], [24.8, -1]]) {
    for (const z of [10.5, 12, 13.5]) {
      const p = z + 0.16 * sentido;
      flechas.push(x, Y, z - 0.16 * sentido, x, Y, p, x - 0.07, Y, p - 0.1 * sentido, x, Y, p, x + 0.07, Y, p - 0.1 * sentido, x, Y, p);
    }
  }

  const orden = azar(5);
  const sorteadas = plazas.map((p) => ({ p, o: orden() })).sort((a, b) => a.o - b.o);
  const reservadas = sorteadas.slice(0, RESERVADAS).map((s) => s.p);
  const rellenos = [];
  for (const p of reservadas) cuadro(rellenos, p[0] + 0.04, p[1] + 0.03, p[2] - 0.04, p[3] - 0.03, 0.04);
  // Otros clientes del garage: autos en planta, en tinta media.
  const ajenos = [];
  for (const { p } of sorteadas.slice(RESERVADAS, RESERVADAS + 38)) {
    rectangulo(ajenos, p[0] + 0.06, p[1] + 0.045, p[2] - 0.06, p[3] - 0.045, Y);
  }

  // Consumos: sobre cada plaza reservada se apilan losas, una por hora de estadía.
  // El orden es por nivel, así todas las columnas crecen juntas.
  const horas = azar(23);
  const pilas = reservadas.map((p) => ({ p, h: 2 + Math.floor(horas() * 8) }));
  const LOSA = 0.055;
  const consumos = { lados: [], tapas: [], aristas: [], losas: 0 };
  for (let nivel = 0; nivel < 9; nivel++) {
    for (const { p, h } of pilas) {
      if (nivel >= h) continue;
      const a = [p[0] + 0.06, p[1] + 0.035, p[2] - 0.06, p[3] - 0.035];
      const y0 = 0.04 + nivel * LOSA;
      const y1 = y0 + LOSA;
      const lados = [];
      caja(lados, consumos.aristas, a[0], a[1], a[2], a[3], y1, y0);
      consumos.lados.push(...lados.slice(18));           // sin la tapa (las primeras 6 posiciones × 3)
      cuadro(consumos.tapas, a[0], a[1], a[2], a[3], y1);
      consumos.losas++;
    }
  }
  return { lineas, muro, flechas, rellenos, ajenos, consumos, reservadas };
}

// ── La llegada al portón ─────────────────────────────────────────────────────
// El auto avanza por el carril durante la primera parte del tramo (hasta LLEGADA);
// en el resto se escanea el código, que muestra el detalle ampliado.
export const LLEGADA = 0.55;
const AUTO_DESDE = PORTON.z - 1.55;
const AUTO_HASTA = PORTON.z - 0.08;   // la ventanilla queda en la línea del portón
export const posicionAuto = (ingreso) => AUTO_DESDE + (AUTO_HASTA - AUTO_DESDE) * (1 - (1 - Math.min(1, ingreso / LLEGADA)) ** 3);
// El garagista espera del lado del conductor, a un paso de la ventanilla.
export const PARADA_GARAGISTA = [24.19, AUTO_HASTA - 0.01];

// ── Autos y personas (para la manzana y para la entrada) ─────────────────────
// Auto de 4,4 m: perfil lateral extruido. El frente mira a +X; el origen está en el centro, a nivel del piso.
function construirCoche() {
  const perfil = [[-0.22, 0.035], [-0.22, 0.08], [-0.13, 0.09], [-0.075, 0.14], [0.07, 0.14], [0.13, 0.092], [0.21, 0.08], [0.22, 0.035]];
  const M = 0.09;
  const caras = [];
  const aristas = [];
  const n = perfil.length;
  for (let i = 0; i < n; i++) {
    const [ax, ay] = perfil[i];
    const [bx, by] = perfil[(i + 1) % n];
    for (const z of [-M, M]) {
      if (i < n - 1) caras.push(0, 0.035, z, ax, ay, z, bx, by, z);
      aristas.push(ax, ay, z, bx, by, z);
    }
    caras.push(ax, ay, -M, bx, by, -M, bx, by, M, ax, ay, -M, bx, by, M, ax, ay, M);
    aristas.push(ax, ay, -M, ax, ay, M);
  }
  for (const z of [-M - 0.001, M + 0.001]) {
    aristas.push(-0.12, 0.094, z, 0.125, 0.094, z);       // línea de cintura
    for (const cx of [-0.135, 0.14]) {                     // ruedas
      for (let k = 0; k < 8; k++) {
        const a0 = (k / 8) * Math.PI * 2;
        const a1 = ((k + 1) / 8) * Math.PI * 2;
        aristas.push(cx + Math.cos(a0) * 0.034, 0.034 + Math.sin(a0) * 0.034, z, cx + Math.cos(a1) * 0.034, 0.034 + Math.sin(a1) * 0.034, z);
      }
    }
  }
  return { caras, aristas };
}

function construirPersona() {
  const caras = [];
  const aristas = [];
  prisma(caras, aristas, 0, 0, 0.024, 0, 0.135);
  prisma(caras, aristas, 0, 0, 0.014, 0.142, 0.172);
  return { caras, aristas };
}

// Vuelta a la manzana de la oficina: rectángulo por el eje de las calles, con esquinas redondeadas.
function construirVuelta() {
  const L = 6;
  const R = 1.1;
  const pts = [];
  const esquinas = [[L - R, -L + R, -Math.PI / 2], [L - R, L - R, 0], [-L + R, L - R, Math.PI / 2], [-L + R, -L + R, Math.PI]];
  for (const [cx, cz, a0] of esquinas) {
    for (let k = 0; k <= 8; k++) {
      const a = a0 + (k / 8) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * R, cz + Math.sin(a) * R]);
    }
  }
  pts.push(pts[0]);
  const acumulado = [0];
  for (let i = 1; i < pts.length; i++) acumulado.push(acumulado[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const linea = [];
  for (let i = 1; i < pts.length; i++) linea.push(pts[i - 1][0], 0.03, pts[i - 1][1], pts[i][0], 0.03, pts[i][1]);
  return { pts, acumulado, largo: acumulado.at(-1), linea };
}

// Posición y rumbo sobre la vuelta, para un avance s en unidades (cíclico).
export function puntoEnVuelta(vuelta, s, destino) {
  const { pts, acumulado, largo } = vuelta;
  const d = ((s % largo) + largo) % largo;
  let i = 1;
  while (i < acumulado.length - 1 && acumulado[i] < d) i++;
  const t = (d - acumulado[i - 1]) / (acumulado[i] - acumulado[i - 1] || 1);
  const [ax, az] = pts[i - 1];
  const [bx, bz] = pts[i];
  destino.x = ax + (bx - ax) * t;
  destino.z = az + (bz - az) * t;
  destino.rumbo = Math.atan2(-(bz - az), bx - ax);   // rotación en Y para que +X apunte al avance
  return destino;
}

// ── El auto que estaciona: entra por el portón, toma la calle interna y se
// mete de punta en la primera plaza del trato (la que se pinta primero). ──
function redondear(puntos, radio) {
  const pts = [puntos[0]];
  for (let i = 1; i < puntos.length - 1; i++) {
    const [a, p, b] = [puntos[i - 1], puntos[i], puntos[i + 1]];
    const la = Math.hypot(p[0] - a[0], p[1] - a[1]);
    const lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const r = Math.min(radio, la / 2, lb / 2);
    const p0 = [p[0] + ((a[0] - p[0]) / la) * r, p[1] + ((a[1] - p[1]) / la) * r];
    const p1 = [p[0] + ((b[0] - p[0]) / lb) * r, p[1] + ((b[1] - p[1]) / lb) * r];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      const u = 1 - t;
      pts.push([u * u * p0[0] + 2 * u * t * p[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * p[1] + t * t * p1[1]]);
    }
  }
  pts.push(puntos.at(-1));
  const acumulado = [0];
  for (let i = 1; i < pts.length; i++) acumulado.push(acumulado[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, acumulado, largo: acumulado.at(-1) };
}
const f32 = (a) => new Float32Array(a);
const empacar = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? f32(v) : v]));

const ciudad = construirCiudad();
const hitos = construirHitos();
const ruta = construirRuta();
const planta = construirPlanta();

// Edificios en el mismo orden que sus caras (10 triángulos cada uno): sirve para
// saber cuál está bajo el cursor a partir del índice del triángulo.
export const EDIFICIOS = ciudad.edificios;
delete ciudad.edificios;
// Plazas del trato en el orden en que se reservan.
export const PLAZAS_RESERVADAS = planta.reservadas;
delete planta.reservadas;
// Entre las primeras plazas que se reservan, la más profunda: así el recorrido se luce.
export const INDICE_PLAZA_DEL_AUTO = PLAZAS_RESERVADAS.slice(0, 4)
  .reduce((mejor, p, i, lista) => (p[1] > lista[mejor][1] ? i : mejor), 0);
export const PLAZA_DEL_AUTO = PLAZAS_RESERVADAS[INDICE_PLAZA_DEL_AUTO];
export const ESTACIONA = (() => {
  const [x0, z0, x1, z1] = PLAZA_DEL_AUTO;
  const zc = (z0 + z1) / 2;
  // Calle interna que da a la plaza (x = 23.2 o 24.8) y de qué lado entra.
  const calle = x1 <= 24 ? 23.2 : 24.8;
  const entra = x0 < calle ? x1 - 0.2 : x0 + 0.2;
  return redondear([[24, PORTON.z - 1.6], [24, G1.z0 + 0.25], [calle, G1.z0 + 0.25], [calle, zc], [entra, zc]], 0.24);
})();
// Posición y rumbo sobre el trayecto para un avance t de 0 a 1 (sin vuelta cíclica).
export function puntoEnEstaciona(t, destino) {
  const s = Math.min(Math.max(t, 0), 1) * ESTACIONA.largo * 0.99999;
  return puntoEnVuelta(ESTACIONA, s, destino);
}

// Calles con tráfico ambiental: ejes entre manzanas (c * PASO + 6), lejos de la
// manzana de la oficina y del recorrido del trato.
export const CALLES = [
  { eje: 'x', en: -30, sentido: 1 }, { eje: 'x', en: 42, sentido: -1 }, { eje: 'x', en: -66, sentido: 1 },
  { eje: 'z', en: -18, sentido: -1 }, { eje: 'z', en: 30, sentido: 1 }, { eje: 'z', en: -54, sentido: 1 },
  { eje: 'x', en: 66, sentido: 1 }, { eje: 'z', en: 54, sentido: -1 },
];
export const LIMITE_CIUDAD = RADIO * PASO + 6;

// Garages con ficha, en el orden de GARAGES_DEMO.lista: el del trato, los dos
// marcados desde el inicio y los que se suman en el cierre.
export const GARAGES = [G1, G2, G3, ...SUMADOS].map((g, i) => {
  const cx = (g.x0 + g.x1) / 2;
  const cz = (g.z0 + g.z1) / 2;
  // Distancia por la calle (en manzanas no se va en diagonal), en metros.
  // El del trato usa el largo real de la ruta dibujada, para que coincida con la cota.
  const metros = i === 0 ? ruta.metros : Math.round((Math.abs(cx) + Math.abs(cz)) * 10 / 50) * 50;
  return { ...g, cx, cz, metros };
});
export const CARAS_GARAGES = (() => {
  const caras = [];
  for (const g of GARAGES) caja(caras, null, g.x0, g.z0, g.x1, g.z1, g.h);
  return new Float32Array(caras);
})();

export const MUNDO = {
  ciudad: empacar(ciudad),
  oficina: empacar(hitos.oficina),
  trato: empacar(hitos.trato),
  otros: empacar(hitos.otros),
  sumados: empacar(hitos.sumados),
  ruta: { cinta: f32(ruta.cinta), metros: ruta.metros },
  planta: { ...empacar(planta), consumos: empacar(planta.consumos) },
  coche: empacar(construirCoche()),
  persona: empacar(construirPersona()),
  vuelta: (() => { const v = construirVuelta(); return { ...v, linea: f32(v.linea) }; })(),
};

// Puntos del dibujo donde se anclan los rótulos HTML.
export const ANCLAS = {
  oficina: [0, OFICINA.h + 0.3, 0],
  g1: [24, G1.h + 0.2, 12],
  g2: [-24, G2.h + 0.2, -24],
  g3: [36, G3.h + 0.2, -24],
  sumados: SUMADOS.map((g) => [(g.x0 + g.x1) / 2, g.h + 0.2, (g.z0 + g.z1) / 2]),
  cota: [15, 0.1, 6],
  entrada: [24, 0, PORTON.z - 0.25],
};
