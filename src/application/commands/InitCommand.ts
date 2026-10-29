import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
export class InitCommand implements Command {
  readonly mode = 'io';
  constructor(private readonly width = 800, private readonly height = 600) {}
  execute(session: EditorSession): string { session.init(this.width, this.height); return `canvas ${this.width}x${this.height} created`; }
}
