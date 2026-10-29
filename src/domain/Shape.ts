import { NumberValue } from './NumberValue.js';

export abstract class Shape {
  private readonly style = new Map<string, string>();
  abstract readonly tag: string;
  constructor(private readonly identity: string) {
    if (!identity || /[\s\x00-\x1f"'<>/=]/u.test(identity)) throw new Error(`invalid id: ${identity}`);
  }
  get id(): string { return this.identity; }
  get label(): string { return `${this.tag}#${this.id}`; }
  get children(): readonly Shape[] { return []; }
  get content(): string { return ''; }
  get acceptsText(): boolean { return false; }
  attributes(): ReadonlyMap<string, string> { return new Map([['id', this.id], ...this.style]); }
  set(attribute: string, value: string): void {
    if (!['fill', 'stroke', 'stroke-width'].includes(attribute)) throw new Error(`unknown attribute: ${attribute}`);
    if (attribute === 'stroke-width') value = String(NumberValue.parse(value, attribute, 0));
    if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/u.test(value)) throw new Error('invalid control character');
    if (attribute !== 'stroke-width' && !/^(?:#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})|[a-z]+|(?:rgb|rgba|hsl|hsla)\([\d\s.,%+-]+\))$/i.test(value)) {
      throw new Error(`unsupported paint: ${value}`);
    }
    this.style.set(attribute, value);
  }
  protected copyStyle(target: Shape): void { for (const [key, value] of this.style) target.set(key, value); }
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  abstract clone(): Shape;
  abstract summary(): string;
}
