import { GeometryShape } from './GeometryShape.js';
export class Circle extends GeometryShape {
  readonly tag = 'circle';
  constructor(id: string, values: readonly number[] = []) { super(id, { cx: 'x', cy: 'y', r: 'size' }, values); }
  clone(): Circle { const copy = new Circle(this.id, this.values()); this.copyStyle(copy); return copy; }
}
