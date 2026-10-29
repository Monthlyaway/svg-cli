import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
export class SaveCommand implements Command {
  readonly mode = 'io'; constructor(private readonly path?: string) {}
  execute(session: EditorSession): string { return session.save(this.path); }
}
