# Logo 3D de SmartLot

El logo (la P con la flecha) existe en volumen en dos versiones que salen de la **misma silueta en código**:

| Versión | Dónde | Qué es |
|---|---|---|
| Liviana (web) | Cierre de la landing (`/`) y cierre de "Para garages" (`/para-garages`) | `ExtrudeGeometry` sin bisel, caras planas sin luces y aristas en tinta: el mismo lenguaje de dibujo de la landing inmersiva (ADR-008). Unos pocos miles de triángulos, sin archivos binarios. |
| Pesada (archivo) | `modelos3d/logo-smartlot/` | GLB de alta (≈50 000 triángulos, ≈1,2 MB) con bisel suave, curvas 8× más subdivididas y material PBR. No se sirve en la web: es material de trabajo para renders, video o impresión. |

## Silueta

- `src/componentesLanding/logo3d/formaLogo.js`: datos puros (sin three). La P es un único trazo abierto de ancho constante (rectas + arcos concéntricos) y la flecha, un asta cortada a 45° con punta de alas cóncavas. Se midió sobre el logo original (2048 × 1118 px); al rasterizar la silueta y compararla con la imagen da IoU ≈ 0,97 (la diferencia es el antialias del borde).
- `src/componentesLanding/logo3d/geometriaLogo.js`: la extrusión en three, compartida por las dos landings y por el script del modelo de alta.
- Pruebas: `formaLogo.test.js` (contornos cerrados, proporción, orientación).

La reconstrucción siguió el método de [img2threejs](https://github.com/img2threejs/img2threejs): intake de la imagen con sus scripts (`probe_image.py`), modelo procedural en código (sin mallas descargadas ni fotogrametría), revisión del render contra la referencia y corrección. Su pipeline completo de *sculpt spec* está pensado para objetos con volumen y materiales; para un logo plano se usó su recomendación de `Shape` + extrusión.

## Landing (`/`)

- Escena `inmersiva/three/escenas/Logo.jsx`, fx `logo` en la sección `accion` (`scroll/coreografia.js`).
- En el cierre el logo ocupa el lugar del pin del hero: sube desde la terraza de la oficina, queda de frente a la cámara y se mece sin ponerse de canto. El pin ya no vuelve en el cierre.
- Materiales `logoCara`, `logoLado` y `logoLinea` en `paleta.js`, coloreados con los tokens `--senal`, `--senal-activa` y `--tinta`.

## Para garages (`/para-garages`)

- `paraGarages/GarageLogo.jsx` (capa DOM, sin three) monta `GarageLogoEscena.jsx` con `lazy()` recién cuando el cierre se acerca a la pantalla y solo si hay WebGL. Sin WebGL no se muestra nada (es decorativo, `aria-hidden`).
- La escena es un garage dibujado en líneas (portón, plazas pintadas, vereda) con el logo flotando sobre el techo y ondas en la terraza. Colores desde los tokens `--color-brand-*` vía variables CSS del contenedor.
- Fuera de pantalla no dibuja (`frameloop="demand"`); con movimiento reducido queda un solo cuadro quieto.

## Regenerar el modelo de alta

```bash
node scripts/logo3d/generarModelo.mjs        # escribe modelos3d/logo-smartlot/logo-smartlot-alta.glb y modelo.json
node scripts/logo3d/renderizarModelo.cjs     # renders PNG con el Chromium de Playwright
```

Si cambia el logo, se edita `formaLogo.js` y se regeneran ambas versiones a la vez.
