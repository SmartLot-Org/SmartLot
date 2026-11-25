// Renderiza el GLB de alta en PNG con el Chromium de Playwright (WebGL por
// software si no hay GPU). Uso: node scripts/logo3d/renderizarModelo.cjs [carpeta]
const { chromium } = require('playwright');
const { readFileSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');

const raiz = resolve(__dirname, '../..');
const carpeta = resolve(process.argv[2] ?? join(raiz, 'modelos3d/logo-smartlot'));
const three = join(raiz, 'node_modules/three');

// Tomas: nombre, ángulo Y de la cámara (grados), elevación, fondo.
const TOMAS = [
  ['render-frente', 0, 4, '#F5F7FB'],
  ['render-tres-cuartos', 38, 14, '#F5F7FB'],
  ['render-perfil', 72, 8, '#F5F7FB'],
  ['render-oscuro', -30, 10, '#0C1E3F'],
];

const pagina = `<!doctype html><html><body style="margin:0">
<script type="importmap">{"imports":{"three":"http://render.local/three/build/three.module.js","three/addons/":"http://render.local/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const W = 1600, H = 1600;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const escena = new THREE.Scene();
escena.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
escena.environmentIntensity = 0.55;
const sol = new THREE.DirectionalLight(0xffffff, 1.6);
sol.position.set(2.5, 4, 3);
sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048);
sol.shadow.radius = 8;
Object.assign(sol.shadow.camera, { left: -1.5, right: 1.5, top: 1.5, bottom: -1.5 });
escena.add(sol);
const piso = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.18 }));
piso.rotation.x = -Math.PI / 2;
piso.position.y = -0.62;
piso.receiveShadow = true;
escena.add(piso);
const gltf = await new GLTFLoader().loadAsync('http://render.local/modelo.glb');
gltf.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
escena.add(gltf.scene);
const camara = new THREE.PerspectiveCamera(28, W / H, 0.1, 50);
window.tomar = (grados, elevacion, fondo) => {
  escena.background = new THREE.Color(fondo);
  piso.material.opacity = fondo === '#0C1E3F' ? 0.4 : 0.18;
  const a = THREE.MathUtils.degToRad(grados), e = THREE.MathUtils.degToRad(elevacion);
  const d = 3.1;
  camara.position.set(Math.sin(a) * Math.cos(e) * d, Math.sin(e) * d, Math.cos(a) * Math.cos(e) * d);
  camara.lookAt(0, -0.02, 0);
  renderer.render(escena, camara);
  return renderer.domElement.toDataURL('image/png');
};
window.listo = true;
</script></body></html>`;

(async () => {
  const navegador = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await navegador.newPage();
  p.on('pageerror', (e) => console.error(e.message));
  await p.route('http://render.local/**', (ruta) => {
    const url = new URL(ruta.request().url());
    if (url.pathname === '/') return ruta.fulfill({ contentType: 'text/html', body: pagina });
    if (url.pathname === '/modelo.glb') return ruta.fulfill({ contentType: 'model/gltf-binary', body: readFileSync(join(carpeta, 'logo-smartlot-alta.glb')) });
    if (url.pathname.startsWith('/three/')) return ruta.fulfill({ contentType: 'text/javascript', body: readFileSync(join(three, url.pathname.slice('/three/'.length))) });
    return ruta.fulfill({ status: 404, body: '' });
  });
  await p.goto('http://render.local/');
  await p.waitForFunction(() => window.listo === true, null, { timeout: 120000 });
  for (const [nombre, grados, elevacion, fondo] of TOMAS) {
    const datos = await p.evaluate(([g, e, f]) => window.tomar(g, e, f), [grados, elevacion, fondo]);
    writeFileSync(join(carpeta, `${nombre}.png`), Buffer.from(datos.split(',')[1], 'base64'));
    console.log(`${nombre}.png`);
  }
  await navegador.close();
})();
