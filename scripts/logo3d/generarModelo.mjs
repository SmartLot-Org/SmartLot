// Genera el modelo de alta del logo (GLB) a partir de la misma silueta que usan
// las landings (src/componentesLanding/logo3d/formaLogo.js). No se sirve en la
// web: queda en modelos3d/ como fuente para renders, video o impresión 3D.
//
// Uso: node scripts/logo3d/generarModelo.mjs [carpeta-salida]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeVertices, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Color, ExtrudeGeometry, Group, Mesh, MeshPhysicalMaterial, Scene, Shape, Vector2 } from 'three';
import { contornosLogo } from '../../src/componentesLanding/logo3d/formaLogo.js';

const salida = resolve(process.argv[2] ?? 'modelos3d/logo-smartlot');

// Medidas en metros sobre un logo de 1 m de alto: el grosor y el bisel quedan
// proporcionados para verse sólido de perfil sin perder el dibujo del trazo.
const PROFUNDIDAD = 0.14;
const BISEL = 0.008;
const SEGMENTOS_BISEL = 10;
const DETALLE = 8;              // 8× los segmentos de curva de la versión web

// GLTFExporter usa FileReader para el binario; Node no lo trae.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); this.onload?.({ target: this }); });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((b) => {
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(b).toString('base64')}`;
      this.onloadend?.();
      this.onload?.({ target: this });
    });
  }
};

function pieza(contorno) {
  const forma = new Shape(contorno.map(([x, y]) => new Vector2(x, y)));
  const nucleo = PROFUNDIDAD - BISEL * 2;
  let g = new ExtrudeGeometry(forma, {
    depth: nucleo,
    bevelEnabled: true,
    bevelThickness: BISEL,
    // Bisel hacia afuera y fino: con offset negativo las puntas de las alas de la
    // flecha (de grosor cero) se cruzan sobre sí mismas.
    bevelSize: BISEL * 0.5,
    bevelOffset: 0,
    bevelSegments: SEGMENTOS_BISEL,
    curveSegments: 1,
  });
  g.translate(0, 0, -nucleo / 2);
  g.deleteAttribute('uv');            // material liso: sin UV, el archivo pesa menos
  g = mergeVertices(g, 1e-6);
  // Normales suaves en bisel y curvas, quiebre en las esquinas vivas del trazo.
  // Se vuelve a indexar: comparte los vértices con igual posición y normal.
  g = mergeVertices(toCreasedNormals(g, Math.PI / 5), 1e-6);
  g.computeBoundingBox();
  return g;
}

const azul = new MeshPhysicalMaterial({
  name: 'SmartLot azul',
  color: new Color('#2563EB'),   // --color-brand-blue (DESIGN.md)
  roughness: 0.38,
  metalness: 0.0,
  clearcoat: 0.35,
  clearcoatRoughness: 0.18,
});

const [contornoP, contornoFlecha] = contornosLogo(DETALLE);
const logo = new Group();
logo.name = 'LogoSmartLot';
const p = new Mesh(pieza(contornoP), azul);
p.name = 'P';
const flecha = new Mesh(pieza(contornoFlecha), azul);
flecha.name = 'Flecha';
logo.add(p, flecha);
const escena = new Scene();
escena.add(logo);

const triangulos = [p, flecha].reduce((n, m) => n + m.geometry.index.count / 3, 0);
const vertices = [p, flecha].reduce((n, m) => n + m.geometry.attributes.position.count, 0);

const glb = await new GLTFExporter().parseAsync(escena, { binary: true });
mkdirSync(salida, { recursive: true });
const archivo = join(salida, 'logo-smartlot-alta.glb');
writeFileSync(archivo, Buffer.from(glb));
writeFileSync(join(salida, 'modelo.json'), `${JSON.stringify({
  archivo: 'logo-smartlot-alta.glb',
  unidades: 'metros (alto del logo = 1)',
  profundidad: PROFUNDIDAD,
  bisel: BISEL,
  segmentosBisel: SEGMENTOS_BISEL,
  detalleCurvas: DETALLE,
  mallas: ['P', 'Flecha'],
  triangulos,
  vertices,
  bytes: glb.byteLength,
}, null, 2)}\n`);
console.log(`${archivo}: ${triangulos} triángulos, ${vertices} vértices, ${(glb.byteLength / 1024).toFixed(0)} kB`);
