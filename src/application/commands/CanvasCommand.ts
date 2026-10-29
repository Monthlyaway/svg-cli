import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
export class CanvasCommand implements Command {
  get mode(): 'display' | 'io' { return this.width === undefined ? 'display' : 'io'; }
  constructor(private readonly width?: number, private readonly height?: number) {}
  execute(session: EditorSession): string {
    const doc = session.document; if (this.width !== undefined) doc.resize(this.width, this.height!);
    return `canvas ${doc.width}x${doc.height}`;
  }
}
