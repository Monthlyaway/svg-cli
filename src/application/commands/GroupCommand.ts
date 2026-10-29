import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
export class GroupCommand implements Command {
  readonly mode = 'edit';
  constructor(private readonly id: string, private readonly members: readonly string[]) {}
  execute(session: EditorSession): string { session.document.group(this.id, this.members); return `g#${this.id} created with ${this.members.length} children`; }
}
