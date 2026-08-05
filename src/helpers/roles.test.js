import test from 'node:test'; import assert from 'node:assert/strict';
import { getUserHomeRoute, getUserRoleName, userHasRole } from './roles.js';
test('reconoce dueno por tipo_rol normalizado', () => assert.equal(getUserRoleName({ id_rol: 99, tipo_rol: '  due\u00f1o_garage ' }), 'due\u00f1o_garage'));
test('mantiene ID historico 5 como fallback', () => assert.equal(getUserRoleName({ id_rol: 5 }), 'due\u00f1o_garage'));
test('resuelve dashboard del dueno', () => assert.equal(getUserHomeRoute({ tipo_rol: 'due\u00f1o_garage' }), '/duenio-garage/dashboard'));
test('no confunde dueno con garagista', () => assert.equal(userHasRole({ tipo_rol: 'due\u00f1o_garage' }, 'garagista'), false));
test('normaliza el nombre real smartlot como superadmin', () => {
  assert.equal(getUserRoleName({ id_rol: 4, tipo_rol: 'smartlot' }), 'superadmin');
  assert.equal(getUserHomeRoute({ id_rol: 4, tipo_rol: 'smartlot' }), '/superadmin_dashboard');
});
