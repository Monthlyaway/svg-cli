import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
export class UngroupCommand implements Command {
  readonly mode = 'edit';
  constructor(private readonly id: string) {}
  execute(session: EditorSession): string { session.document.ungroup(this.id); return `g#${this.id} ungrouped`; }
}
