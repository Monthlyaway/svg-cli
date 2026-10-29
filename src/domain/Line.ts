import { GeometryShape } from './GeometryShape.js';
export class Line extends GeometryShape {
  readonly tag = 'line';
  constructor(id: string, values: readonly number[] = []) { super(id, { x1: 'x', y1: 'y', x2: 'x', y2: 'y' }, values); }
  clone(): Line { const copy = new Line(this.id, this.values()); this.copyStyle(copy); return copy; }
}
