import { Shape } from './Shape.js';
import { NumberValue } from './NumberValue.js';

export abstract class GeometryShape extends Shape {
  private readonly geometry = new Map<string, number>();
  constructor(id: string, private readonly axes: Readonly<Record<string, 'x' | 'y' | 'size'>>, values: readonly number[]) {
    super(id);
    Object.keys(axes).forEach((key, i) => this.set(key, String(values[i] ?? 0)));
  }
  override attributes(): ReadonlyMap<string, string> {
    return new Map([...super.attributes(), ...Array.from(this.geometry, ([key, value]) => [key, String(value)] as const)]);
  }
  override set(attribute: string, value: string): void {
    if (Object.hasOwn(this.axes, attribute)) {
      this.geometry.set(attribute, NumberValue.parse(value, attribute, this.axes[attribute] === 'size' ? 0 : -Infinity));
    } else super.set(attribute, value);
  }
  override move(dx: number, dy: number): void {
    NumberValue.parse(dx); NumberValue.parse(dy);
    const next = new Map(this.geometry);
    for (const [key, value] of next) {
      const axis = this.axes[key];
      next.set(key, NumberValue.parse(value + (axis === 'x' ? dx : axis === 'y' ? dy : 0)));
    }
    for (const [key, value] of next) this.geometry.set(key, value);
  }
  override scale(factor: number): void {
    NumberValue.positive(factor, 'scale factor');
    const next = new Map(Array.from(this.geometry, ([key, value]) => [key, NumberValue.parse(value * factor)]));
    for (const [key, value] of next) this.geometry.set(key, value);
  }
  protected values(): number[] { return [...this.geometry.values()]; }
  override summary(): string { return `${this.label}  ${Array.from(this.attributes()).filter(([key]) => key !== 'id').map(([key, value]) => `${key}=${value}`).join(' ')}`; }
}
