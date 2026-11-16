import { BufferAttribute, BufferGeometry } from 'three';

export function geometria(posiciones) {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(posiciones, 3));
  return g;
}
