import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
export class DeleteCommand implements Command {
  readonly mode = 'edit';
  constructor(private readonly id: string) {}
  execute(session: EditorSession): string { const label = session.document.require(this.id).label; session.document.delete(this.id); return `${label} deleted`; }
}
