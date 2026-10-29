import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
export class ScaleCommand implements Command {
  readonly mode = 'edit';
  constructor(private readonly id: string, private readonly factor: number) {}
  execute(session: EditorSession): string { const shape = session.document.require(this.id); shape.scale(this.factor); return `${shape.label} scaled by ${this.factor}`; }
}
