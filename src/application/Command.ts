import type { EditorSession } from './EditorSession.js';
export interface Command {
  readonly mode: 'edit' | 'io' | 'display' | 'history';
  execute(session: EditorSession): string;
}
