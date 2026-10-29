import { Shape } from './Shape.js';
import { NumberValue } from './NumberValue.js';
export class Group extends Shape {
  readonly tag = 'g';
  private items: Shape[] = [];
  override get children(): readonly Shape[] { return [...this.items]; }
  insert(shape: Shape, index = this.items.length): void { this.items.splice(index, 0, shape); }
  remove(shape: Shape): number {
    const index = this.items.indexOf(shape);
    if (index < 0) throw new Error(`no such child: ${shape.id}`);
    this.items.splice(index, 1); return index;
  }
  override move(dx: number, dy: number): void { for (const child of this.items) child.move(dx, dy); }
  override scale(factor: number): void { NumberValue.positive(factor, 'scale factor'); for (const child of this.items) child.scale(factor); }
  clone(): Group { const copy = new Group(this.id); this.copyStyle(copy); for (const child of this.items) copy.insert(child.clone()); return copy; }
  summary(): string { return `${this.label}${Array.from(this.attributes()).filter(([key]) => key !== 'id').map(([key, value]) => ` ${key}=${value}`).join('')}`; }
}
