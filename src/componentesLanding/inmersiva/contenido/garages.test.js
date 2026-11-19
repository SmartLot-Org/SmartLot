import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUSQUEDA, CHAT, CONSUMOS, CTA, ENLACE, META, PIE, ROTULOS, SECCIONES, SOLICITUD, VISIBILIDAD,
} from './garages.js';
// El recorrido del pedido sale del mundo del dibujo (sin three): la ficha y las figuras
// tienen que decir la misma distancia que se dibuja.
import { MUNDO } from '../three/mundo.js';

const PEDIDO = `${MUNDO.ruta.metros} ${ROTULOS.distancia.unidad}`;

const GUION = ['gancho', 'problema', 'alta', 'mapa', 'trato', 'operacion', 'control', 'accion'];
const pesos = (t) => Number(t.replace(/[^\d]/g, ''));
const horas = (t) => {
  const [, h, m] = t.match(/^(\d+) h (\d+) min$/);
  return Number(h) + Number(m) / 60;
};
// El texto que lee el visitante, fuera de los datos de ejemplo de las piezas y del dibujo.
const copy = () => [
  META.titulo, META.descripcion, CTA.etiqueta, ENLACE.etiqueta, PIE,
  ...SECCIONES.flatMap((s) => [s.titulo, s.cuerpo]),
].join(' ');
const todo = () => JSON.stringify({ META, CTA, ENLACE, PIE, SECCIONES, BUSQUEDA, CONSUMOS, VISIBILIDAD, SOLICITUD, CHAT, ROTULOS });

test('hay entre cinco y ocho secciones con ids únicos, en el orden del guion', () => {
  assert.ok(SECCIONES.length >= 5 && SECCIONES.length <= 8);
  const ids = SECCIONES.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z]+$/);
  assert.deepEqual(ids, GUION);
});

test('cada título tiene de 3 a 8 palabras y hasta 40 caracteres; cada cuerpo, de 1 a 3 oraciones', () => {
  for (const s of SECCIONES) {
    const palabras = s.titulo.trim().split(/\s+/).length;
    assert.ok(palabras >= 3 && palabras <= 8, `${s.id}: ${palabras} palabras`);
    assert.ok(s.titulo.length <= 40, `${s.id}: ${s.titulo.length} caracteres`);
    const oraciones = s.cuerpo.split(/[.!?]+/).filter((o) => o.trim()).length;
    assert.ok(oraciones >= 1 && oraciones <= 3, `${s.id}: ${oraciones} oraciones`);
  }
  assert.equal(SECCIONES[0].titulo, 'Aparecé en el mapa de las empresas');
});

test('el weight de cada sección está entre 0,8 y 2,5 pantallas', () => {
  for (const s of SECCIONES) assert.ok(s.weight >= 0.8 && s.weight <= 2.5, s.id);
});

test('cada sección describe su figura para la versión sin 3D, también los dos estados del interruptor', () => {
  for (const s of SECCIONES) assert.ok(typeof s.figura === 'string' && s.figura.length > 30, s.id);
  for (const estado of [VISIBILIDAD.visible, VISIBILIDAD.borrador]) {
    assert.ok(estado.figura.length > 30, estado.estado);
    assert.match(estado.poster, /^[a-z]+$/);
  }
  assert.equal(SECCIONES.find((s) => s.id === 'control').figura, VISIBILIDAD.visible.figura);
});

test('la CTA va solo en el hero y en la última sección: "Registrá tu garage" hacia el alta de dueño', () => {
  const conCta = SECCIONES.filter((s) => s.cta).map((s) => s.id);
  assert.deepEqual(conCta, [SECCIONES[0].id, SECCIONES.at(-1).id]);
  assert.deepEqual(CTA, { etiqueta: 'Registrá tu garage', destino: '/register?modo=garage' });
  assert.deepEqual(ENLACE, { etiqueta: 'Para empresas', destino: '/' });
});

test('cada nota lleva como mucho una pieza: la búsqueda en mapa, los consumos en operacion y el interruptor en control', () => {
  const conPiezas = Object.fromEntries(SECCIONES.filter((s) => s.piezas).map((s) => [s.id, s.piezas]));
  assert.deepEqual(conPiezas, { mapa: ['busqueda'], operacion: ['consumos'], control: ['visibilidad'] });
});

test('el copy usa voseo y no promete IA, métricas, cobros ni plazos', () => {
  const texto = todo();
  // Imperativos con tuteo al empezar una frase ("te pide cocheras" es tercera persona).
  assert.doesNotMatch(texto, /Regístrate|Crea tu|Pide |Elige |Publica tu/);
  assert.doesNotMatch(texto, /(?<!\p{L})[Tt]ú(?!\p{L})/u);
  assert.doesNotMatch(texto, /\bIA\b|inteligencia artificial/i);
  assert.doesNotMatch(texto, /4[.,]9|4[.,]8|24\/7|satisfacci|testimonio|clientes felices/i);
  assert.doesNotMatch(texto, /esta semana|en minutos|sin costo|gratis|cobrá|del futuro|ganancia|ganá|más ingresos/i);
  // "Cobro" solo aparece en la aclaración de la tabla, que dice que no lo son.
  assert.equal(CONSUMOS.pie, 'Son consumos generados, no cobros. Se exportan a PDF y Excel.');
  assert.doesNotMatch(texto.replace(CONSUMOS.pie, ''), /cobr/i);
});

test('están los cuatro claims vigentes y ninguna otra cifra fuera de los datos de ejemplo', () => {
  const secciones = SECCIONES.map((s) => s.cuerpo).join(' ');
  assert.match(secciones, /24 meses de historial/);
  assert.match(secciones, /auto, moto y pickup/);
  assert.match(secciones, /100% online/);
  assert.match(secciones, /sin hardware/i);
  assert.match(secciones, /PDF y Excel/);
  const cifras = copy().match(/\d+(?:[.,]\d+)?/g) ?? [];
  assert.deepEqual([...new Set(cifras)].sort(), ['100', '24']);
  // Las figuras describen el dibujo: su única cifra es la distancia del pedido.
  for (const s of SECCIONES) {
    for (const cifra of s.figura.match(/\d+/g) ?? []) assert.equal(`${cifra} m`, PEDIDO, s.id);
  }
});

test('las reglas de negocio 4, 5 y 6 están en el texto de operacion, trato y control', () => {
  const cuerpo = (id) => SECCIONES.find((s) => s.id === id).cuerpo;
  assert.match(cuerpo('operacion'), /la ocupación la mueven las reservas y los ingresos con QR, nunca una carga a mano/);
  assert.match(cuerpo('trato'), /Nada se activa sin tu confirmación, tampoco un cambio en la cantidad de cocheras/);
  assert.match(cuerpo('control'), /borrador, deja de aparecer para las empresas/);
  assert.match(cuerpo('control'), /Cada dueño ve solo sus garages/);
});

test('los datos de ejemplo lo dicen', () => {
  for (const datos of [BUSQUEDA, CONSUMOS, VISIBILIDAD, SOLICITUD]) assert.equal(datos.aviso, 'Datos de ejemplo');
});

test('en la tabla de consumos las filas suman el total y el tiempo por la tarifa da cada importe', () => {
  const { filas, total, tarifa, columnas } = CONSUMOS;
  assert.deepEqual(columnas, ['Empresa', 'Reservas', 'Tiempo', 'Importe generado']);
  assert.equal(filas.length, 3);
  const suma = (campo) => filas.reduce((acc, f) => acc + campo(f), 0);
  assert.equal(suma((f) => f.reservas), total.reservas);
  assert.equal(suma((f) => pesos(f.importe)), pesos(total.importe));
  assert.equal(suma((f) => horas(f.tiempo)), horas(total.tiempo));
  for (const f of [...filas, total]) assert.equal(Math.round(horas(f.tiempo) * pesos(tarifa)), pesos(f.importe), f.empresa ?? f.etiqueta);
});

test('la ficha, el alta, la solicitud y el dibujo cuentan el mismo garage', () => {
  // La distancia de la ficha es la cota del pedido: 0,3 km son 300 m.
  const km = Number(BUSQUEDA.distancia.match(/^([\d,]+) km/)[1].replace(',', '.'));
  assert.equal(`${Math.round(km * 1000)} m`, PEDIDO);
  // Las plazas para reservas del alta son las disponibles de la ficha.
  const [, plazas, reservas] = ROTULOS.alta.plazas.match(/^(\d+) plazas · (\d+) para reservas$/);
  assert.equal(BUSQUEDA.disponibles, `${reservas} de ${plazas} disponibles`);
  // Las tarifas son las mismas en la ficha, en la cota del alta y en la tabla.
  assert.ok(ROTULOS.alta.tarifas.startsWith(BUSQUEDA.tarifas));
  assert.match(BUSQUEDA.tarifas, new RegExp(`^Auto ${CONSUMOS.tarifa.replace('/h', '').replace(/[$.]/g, '\\$&')} `));
  assert.match(BUSQUEDA.horario, new RegExp(`^${ROTULOS.alta.horario.split(' · ')[0]} · `));
  // El pedido entra en las plazas disponibles y la empresa es la de la primera fila de consumos.
  assert.ok(SOLICITUD.cocheras >= 1 && SOLICITUD.cocheras <= Number(reservas));
  assert.equal(SOLICITUD.empresa, CONSUMOS.filas[0].empresa);
  assert.equal(SOLICITUD.garage.nombre, BUSQUEDA.nombre);
  assert.equal(ROTULOS.garage, BUSQUEDA.nombre);
});

test('el chat del garage tiene globos cortos y quién escribe cada uno', () => {
  assert.ok(CHAT.length >= 6 && CHAT.length <= 10);
  for (const m of CHAT) {
    assert.ok(m.de && m.texto, JSON.stringify(m));
    assert.ok(m.texto.length <= 48, m.texto);
  }
});
