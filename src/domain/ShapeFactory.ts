import { Shape } from './Shape.js';
import { Rect } from './Rect.js';
import { Circle } from './Circle.js';
import { Ellipse } from './Ellipse.js';
import { Line } from './Line.js';
import { Text } from './Text.js';
import { Group } from './Group.js';
import { NumberValue } from './NumberValue.js';

export class ShapeFactory {
  // Phase 1's one shape-name dispatch point. A provider registry can replace this in Phase 2.
  private readonly definitions = new Map<string, { count: number; paint?: string; text?: boolean; make: (id: string, values: number[], text: string) => Shape }>([
    ['rect', { count: 4, paint: 'fill', make: (id, v) => new Rect(id, v) }],
    ['circle', { count: 3, paint: 'fill', make: (id, v) => new Circle(id, v) }],
    ['ellipse', { count: 4, paint: 'fill', make: (id, v) => new Ellipse(id, v) }],
    ['line', { count: 4, paint: 'stroke', make: (id, v) => new Line(id, v) }],
    ['text', { count: 2, text: true, make: (id, v, text) => new Text(id, v, text) }],
    ['g', { count: 0, make: id => new Group(id) }],
  ]);
  create(type: string, id: string, args: readonly string[] = [], fromXml = false): Shape {
    const definition = this.definitions.get(type);
    if (!definition) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    if (fromXml) return definition.make(id, [], '');
    const minimum = definition.count + (definition.text ? 1 : 0);
    if (args.length < minimum || args.length > minimum + (definition.paint ? 1 : 0)) throw new Error(`invalid parameters for ${type}; use 'help'`);
    const shape = definition.make(id, args.slice(0, definition.count).map(v => NumberValue.parse(v)), definition.text ? args[definition.count]! : '');
    if (definition.paint && args[minimum] !== undefined) shape.set(definition.paint, args[minimum]!);
    return shape;
  }
}
