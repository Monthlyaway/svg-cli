import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
export class ReadCommand implements Command {
  readonly mode = 'io'; constructor(private readonly path: string) {}
  execute(session: EditorSession): string { return session.read(this.path); }
}
