import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
export class AddToCommand implements Command {
  readonly mode = 'edit';
  constructor(private readonly group: string, private readonly id: string) {}
  execute(session: EditorSession): string { session.document.addTo(this.group, this.id); return `${session.document.require(this.id).label} added to g#${this.group}`; }
}
