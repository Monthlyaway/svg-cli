import { GeometryShape } from './GeometryShape.js';
export class Ellipse extends GeometryShape {
  readonly tag = 'ellipse';
  constructor(id: string, values: readonly number[] = []) { super(id, { cx: 'x', cy: 'y', rx: 'size', ry: 'size' }, values); }
  clone(): Ellipse { const copy = new Ellipse(this.id, this.values()); this.copyStyle(copy); return copy; }
}
