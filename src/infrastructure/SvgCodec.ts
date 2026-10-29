import { DOMParser } from '@xmldom/xmldom';
import type { Element } from '@xmldom/xmldom';
import { Document } from '../domain/Document.js';
import { Shape } from '../domain/Shape.js';
import { Group } from '../domain/Group.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
import { NumberValue } from '../domain/NumberValue.js';

export class SvgCodec {
  private readonly namespace = 'http://www.w3.org/2000/svg';
  private escape(value: string): string { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll('\r', '&#13;').replaceAll('\n', '&#10;').replaceAll('\t', '&#9;'); }
  encode(document: Document): string {
    document.validate();
    const lines = [`<?xml version="1.0" encoding="UTF-8"?>`, `<svg xmlns="${this.namespace}" width="${document.width}" height="${document.height}" viewBox="0 0 ${document.width} ${document.height}">`];
    const visit = (shape: Shape, depth: number): void => {
      const prefix = '  '.repeat(depth); const attrs = Array.from(shape.attributes(), ([key, value]) => `${key}="${this.escape(value)}"`).join(' ');
      if (shape instanceof Group) {
        lines.push(`${prefix}<g ${attrs}>`); for (const child of shape.children) visit(child, depth + 1); lines.push(`${prefix}</g>`);
      } else if (shape.acceptsText) lines.push(`${prefix}<${shape.tag} ${attrs}>${this.escape(shape.content)}</${shape.tag}>`);
      else lines.push(`${prefix}<${shape.tag} ${attrs}/>`);
    };
    for (const shape of document.children) visit(shape, 1);
    return [...lines, '</svg>', ''].join('\n');
  }
  decode(xml: string): { document: Document; warnings: readonly string[] } {
    if (Buffer.byteLength(xml, 'utf8') > 5 * 1024 * 1024) throw new Error('invalid SVG: maximum file size is 5 MiB');
    if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('invalid SVG: DTD and entities are unsupported');
    let parsed;
    try {
      parsed = new DOMParser({ onError: (level, message) => { throw new Error(`${level}: ${message}`); } }).parseFromString(xml, 'image/svg+xml');
    } catch { throw new Error('invalid SVG: malformed XML'); }
    const root = parsed.documentElement;
    if (!root || root.tagName !== 'svg' || root.namespaceURI !== this.namespace) throw new Error('invalid SVG: expected an SVG namespace root');
    this.checkAttributes(root, new Set(['xmlns','width','height','viewBox']));
    const width = NumberValue.positive(root.getAttribute('width') || '800', 'canvas width');
    const height = NumberValue.positive(root.getAttribute('height') || '600', 'canvas height');
    const viewBox = root.getAttribute('viewBox');
    if (viewBox && viewBox.trim().split(/[\s,]+/).map(Number).join(' ') !== `0 0 ${width} ${height}`) throw new Error('invalid SVG: viewBox must match 0 0 width height');
    const reserved = new Set<string>();
    const scan = (element: Element, depth: number): void => {
      if (depth > 64) throw new Error('invalid SVG: maximum nesting depth is 64');
      const id = element.getAttribute('id');
      if (id) { if (reserved.has(id)) throw new Error(`id already exists: ${id}`); reserved.add(id); }
      if (reserved.size > 10000) throw new Error('invalid SVG: maximum element count is 10000');
      for (const child of Array.from(element.childNodes)) if (child.nodeType === 1) scan(child as Element, depth + 1);
    };
    for (const child of Array.from(root.childNodes)) if (child.nodeType === 1) scan(child as Element, 1);
    const document = new Document(width, height); const warnings: string[] = []; const counters = new Map<string, number>();
    const read = (element: Element, parent?: string): void => {
      if (element.namespaceURI !== this.namespace) throw new Error('invalid SVG: foreign namespace');
      let id = element.getAttribute('id');
      if (!id) {
        let count = counters.get(element.tagName) ?? 0;
        do { count++; id = `${element.tagName}${count}`; } while (reserved.has(id));
        counters.set(element.tagName, count); reserved.add(id);
        warnings.push(`warning: assigned id ${id} to unnamed <${element.tagName}>`);
      }
      const shape = new ShapeFactory().create(element.tagName, id, [], true);
      for (const attr of Array.from(element.attributes)) {
        if (attr.name === 'id') continue;
        if (attr.name === 'data-kind' && shape instanceof Group) { warnings.push(`warning: ${id} imported as plain g (data-kind=${attr.value})`); continue; }
        shape.set(attr.name, attr.value);
      }
      document.add(shape, parent);
      for (const child of Array.from(element.childNodes)) {
        if (child.nodeType === 1) {
          if (!(shape instanceof Group)) throw new Error(`invalid SVG: nested element inside ${shape.tag}`);
          read(child as Element, id);
        } else if ([3,4].includes(child.nodeType)) {
          if (shape.acceptsText) shape.set('text', shape.content + (child.nodeValue ?? ''));
          else if (child.nodeValue?.trim()) throw new Error(`invalid SVG: text inside ${shape.tag}`);
        }
      }
    };
    for (const child of Array.from(root.childNodes)) {
      if (child.nodeType === 1) read(child as Element);
      else if ([3,4].includes(child.nodeType) && child.nodeValue?.trim()) throw new Error('invalid SVG: text outside a shape');
    }
    document.validate(); return { document, warnings };
  }
  private checkAttributes(element: Element, allowed: ReadonlySet<string>): void {
    for (const attribute of Array.from(element.attributes)) if (!allowed.has(attribute.name)) throw new Error(`invalid SVG: unsupported root attribute: ${attribute.name}`);
  }
}
