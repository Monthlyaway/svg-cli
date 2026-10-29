import { Document } from '../domain/Document.js';
import type { Command } from './Command.js';
import type { EditorSession } from './EditorSession.js';
export class SnapshotCommand implements Command {
  readonly mode = 'edit';
  private before?: Document;
  private after?: Document;
  constructor(private readonly command: Command) {}
  execute(session: EditorSession): string {
    this.before = session.document.clone();
    try {
      const result = this.command.execute(session);
      session.document.validate();
      this.after = session.document.clone();
      return result;
    } catch (error) { session.restore(this.before); throw error; }
  }
  undo(session: EditorSession): void { session.restore(this.before!); }
  redo(session: EditorSession): void { session.restore(this.after!); }
}
