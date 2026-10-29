import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
export class SetCommand implements Command {
  readonly mode = 'edit';
  constructor(private readonly id: string, private readonly attribute: string, private readonly value: string) {}
  execute(session: EditorSession): string { const shape = session.document.require(this.id); shape.set(this.attribute, this.value); return `${shape.label} updated: ${this.attribute}=${JSON.stringify(this.value)}`; }
}
