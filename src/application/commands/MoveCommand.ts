import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
export class MoveCommand implements Command {
  readonly mode = 'edit';
  constructor(private readonly id: string, private readonly dx: number, private readonly dy: number) {}
  execute(session: EditorSession): string { const shape = session.document.require(this.id); shape.move(this.dx, this.dy); return `${shape.label} moved by (${this.dx},${this.dy})`; }
}
