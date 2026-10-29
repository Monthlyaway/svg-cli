import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
import { ShapeFactory } from '../../domain/ShapeFactory.js';
export class CreateCommand implements Command {
  readonly mode = 'edit';
  constructor(private readonly type: string, private readonly id: string, private readonly args: readonly string[], private readonly parent?: string) {}
  execute(session: EditorSession): string {
    const shape = new ShapeFactory().create(this.type, this.id, this.args); session.document.add(shape, this.parent);
    return `${shape.label} created${this.parent ? ` in g#${this.parent}` : ''}`;
  }
}
