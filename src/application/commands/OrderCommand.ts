import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
export class OrderCommand implements Command {
  readonly mode = 'edit';
  constructor(private readonly id: string, private readonly front: boolean) {}
  execute(session: EditorSession): string { session.document.reorder(this.id, this.front); return `${session.document.require(this.id).label} sent to ${this.front ? 'front' : 'back'}`; }
}
