import { Shape } from './Shape.js';
import { Group } from './Group.js';
import { NumberValue } from './NumberValue.js';

export class Document {
  private root = new Group('$canvas');
  private w = 800;
  private h = 600;
  constructor(width = 800, height = 600) { this.resize(width, height); }
  get width(): number { return this.w; }
  get height(): number { return this.h; }
  get children(): readonly Shape[] { return this.root.children; }
  resize(width: number, height: number): void {
    NumberValue.positive(width, 'canvas width'); NumberValue.positive(height, 'canvas height');
    this.w = width; this.h = height;
  }
  all(): Shape[] {
    const result: Shape[] = [];
    const visit = (shape: Shape): void => { result.push(shape); for (const child of shape.children) visit(child); };
    for (const child of this.children) visit(child);
    return result;
  }
  has(id: string): boolean { return this.all().some(shape => shape.id === id); }
  require(id: string): Shape {
    const shape = this.all().find(item => item.id === id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }
  container(id: string): Group {
    if (!this.has(id)) throw new Error(`no such container: ${id}`);
    const shape = this.require(id);
    if (!(shape instanceof Group)) throw new Error(`not a container: ${id}`);
    return shape;
  }
  parent(shape: Shape): Group {
    const parent = [this.root, ...this.all()].find(item => item.children.includes(shape));
    if (!(parent instanceof Group)) throw new Error(`no parent for: ${shape.id}`);
    return parent;
  }
  parentLabel(shape: Shape): string { const parent = this.parent(shape); return parent === this.root ? 'svg' : parent.label; }
  add(shape: Shape, containerId?: string): void {
    if (this.has(shape.id)) throw new Error(`id already exists: ${shape.id}`);
    (containerId ? this.container(containerId) : this.root).insert(shape);
    this.validate();
  }
  delete(id: string): void { const shape = this.require(id); this.parent(shape).remove(shape); }
  group(id: string, ids: readonly string[]): void {
    if (!ids.length) throw new Error('group needs at least one shape');
    if (this.has(id)) throw new Error(`id already exists: ${id}`);
    if (new Set(ids).size !== ids.length) throw new Error('duplicate group member');
    const requested = ids.map(item => this.require(item));
    for (const item of requested) {
      if (requested.some(other => other !== item && this.contains(item, other))) throw new Error(`cannot group a container into its own descendant: ${item.id}`);
    }
    const ordered = this.all().filter(item => requested.includes(item));
    const target = this.parent(ordered[0]!);
    const index = target.children.indexOf(ordered[0]!);
    const group = new Group(id);
    for (const item of ordered) { this.parent(item).remove(item); group.insert(item); }
    target.insert(group, index); this.validate();
  }
  ungroup(id: string): void {
    const group = this.container(id); const parent = this.parent(group);
    if (parent === this.root) throw new Error(`cannot ungroup top-level container: ${id}`);
    const index = parent.remove(group);
    group.children.forEach((child, offset) => { group.remove(child); parent.insert(child, index + offset); });
  }
  addTo(gid: string, id: string): void {
    const group = this.container(gid); const shape = this.require(id);
    if (shape === group || this.contains(shape, group)) throw new Error(`cannot move a container into its own descendant: ${id}`);
    this.parent(shape).remove(shape); group.insert(shape); this.validate();
  }
  reorder(id: string, front: boolean): void {
    const shape = this.require(id); const parent = this.parent(shape);
    parent.remove(shape); parent.insert(shape, front ? parent.children.length : 0);
  }
  private contains(shape: Shape, other: Shape): boolean { return shape.children.some(child => child === other || this.contains(child, other)); }
  validate(): void {
    const ids = new Set<string>();
    const visit = (shape: Shape, depth: number): void => {
      if (depth > 64) throw new Error('maximum nesting depth is 64');
      if (ids.has(shape.id)) throw new Error(`id already exists: ${shape.id}`);
      ids.add(shape.id);
      if (ids.size > 10000) throw new Error('maximum element count is 10000');
      for (const child of shape.children) visit(child, depth + 1);
    };
    for (const child of this.children) visit(child, 1);
  }
  clone(): Document { const copy = new Document(this.width, this.height); copy.root = this.root.clone(); return copy; }
}
