import { GeometryShape } from './GeometryShape.js';
export class Rect extends GeometryShape {
  readonly tag = 'rect';
  constructor(id: string, values: readonly number[] = []) { super(id, { x: 'x', y: 'y', width: 'size', height: 'size' }, values); }
  clone(): Rect { const copy = new Rect(this.id, this.values()); this.copyStyle(copy); return copy; }
}
