import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
import { TreeFormatter } from '../TreeFormatter.js';
export class TreeCommand implements Command {
  readonly mode = 'display'; constructor(private readonly id?: string) {}
  execute(session: EditorSession): string { return new TreeFormatter().tree(session.document, this.id); }
}
