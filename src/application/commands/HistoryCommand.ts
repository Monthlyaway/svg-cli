import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
export class HistoryCommand implements Command {
  readonly mode = 'history'; constructor(private readonly isUndo: boolean) {}
  execute(session: EditorSession): string { return this.isUndo ? session.undo() : session.redo(); }
}
