import type { Document } from '../domain/Document.js';
import type { Shape } from '../domain/Shape.js';
export class TreeFormatter {
  tree(document: Document, id?: string): string {
    const lines: string[] = [];
    const visit = (shape: Shape, prefix: string, last: boolean): void => {
      lines.push(`${prefix}${last ? '└── ' : '├── '}${shape.summary()}`);
      shape.children.forEach((child, i, list) => visit(child, prefix + (last ? '    ' : '│   '), i === list.length - 1));
    };
    if (id) {
      const shape = document.require(id); lines.push(shape.summary());
      shape.children.forEach((child, i, list) => visit(child, '', i === list.length - 1));
    } else {
      lines.push(`svg (${document.width}x${document.height})`);
      document.children.forEach((child, i, list) => visit(child, '', i === list.length - 1));
    }
    return lines.join('\n');
  }
  show(document: Document, id: string): string {
    const shape = document.require(id);
    return `${shape.label}  parent=${document.parentLabel(shape)}\n  ${Array.from(shape.attributes()).filter(([key]) => key !== 'id').map(([key, value]) => `${key}=${JSON.stringify(value)}`).join(' ')}${shape.acceptsText ? `\n  text=${JSON.stringify(shape.content)}` : ''}`;
  }
}
