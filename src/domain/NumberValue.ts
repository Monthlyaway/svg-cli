export class NumberValue {
  static parse(value: string | number, label = 'number', minimum = -Infinity): number {
    if (typeof value === 'string' && !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) {
      throw new Error(`invalid ${label}: ${value}`);
    }
    const number = Number(value);
    if (!Number.isFinite(number) || number < minimum) throw new Error(`invalid ${label}: ${value}`);
    return Object.is(number, -0) ? 0 : number;
  }

  static positive(value: string | number, label: string): number {
    const number = this.parse(value, label);
    if (number <= 0) throw new Error(`${label} must be positive`);
    return number;
  }
}
