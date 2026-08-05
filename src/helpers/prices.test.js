import test from 'node:test'; import assert from 'node:assert/strict';
import { parseOptionalNonNegativeNumber } from './prices.js';
test('precios aceptan cero, positivos y strings numericos', () => { assert.equal(parseOptionalNonNegativeNumber(0), 0); assert.equal(parseOptionalNonNegativeNumber(12.5), 12.5); assert.equal(parseOptionalNonNegativeNumber('15.25'), 15.25); });
test('precio vacio no se convierte en cero', () => assert.equal(parseOptionalNonNegativeNumber(''), null));
test('precios rechazan negativos y NaN', () => { assert.throws(() => parseOptionalNonNegativeNumber(-1)); assert.throws(() => parseOptionalNonNegativeNumber(Number.NaN)); });
