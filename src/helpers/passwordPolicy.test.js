import test from 'node:test';
import assert from 'node:assert/strict';
import { cumplePoliticaContraseña } from './passwordPolicy.js';

test('exige 8 caracteres, 2 mayúsculas, 2 números y 2 especiales, como el backend', () => {
  assert.equal(cumplePoliticaContraseña('SeGura12!!'), true);
  assert.equal(cumplePoliticaContraseña('Abcdefg1'), false); // la regla débil que aceptaba "Olvidé mi contraseña"
  assert.equal(cumplePoliticaContraseña('Segura12!!'), false); // una sola mayúscula
  assert.equal(cumplePoliticaContraseña('SeGura1!!x'), false); // un solo número
  assert.equal(cumplePoliticaContraseña('SeGura12!x'), false); // un solo especial
  assert.equal(cumplePoliticaContraseña('S!G@12'), false); // menos de 8
  assert.equal(cumplePoliticaContraseña(undefined), false);
});
