import { GeometryShape } from './GeometryShape.js';
export class Text extends GeometryShape {
  readonly tag = 'text';
  private text = '';
  constructor(id: string, values: readonly number[] = [], content = '') { super(id, { x: 'x', y: 'y' }, values); this.set('text', content); }
  override get content(): string { return this.text; }
  override set(attribute: string, value: string): void {
    if (attribute === 'text') {
      if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/u.test(value)) throw new Error('invalid control character');
      this.text = value;
    } else super.set(attribute, value);
  }
  override summary(): string { return `${super.summary()} ${JSON.stringify(this.text)}`; }
  clone(): Text { const copy = new Text(this.id, this.values(), this.text); this.copyStyle(copy); return copy; }
}
