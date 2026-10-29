import { Document } from '../domain/Document.js';
import type { DocumentStorage } from '../ports/DocumentStorage.js';
import type { Command } from './Command.js';
import { SnapshotCommand } from './SnapshotCommand.js';
export class EditorSession {
  private current?: Document;
  private path?: string;
  private undoStack: SnapshotCommand[] = [];
  private redoStack: SnapshotCommand[] = [];
  private barrier = true;
  constructor(private readonly storage: DocumentStorage) {}
  get document(): Document {
    if (!this.current) throw new Error("no document. use 'init' or 'read' first");
    return this.current;
  }
  restore(document: Document): void { this.current = document.clone(); }
  run(command: Command): string {
    if (command.mode === 'edit') {
      const snapshot = new SnapshotCommand(command); const result = snapshot.execute(this);
      this.undoStack.push(snapshot); if (this.undoStack.length > 100) this.undoStack.shift();
      this.redoStack = []; this.barrier = false; return result;
    }
    const result = command.execute(this);
    if (command.mode === 'io') { this.undoStack = []; this.redoStack = []; this.barrier = true; }
    return result;
  }
  init(width: number, height: number): void { const next = new Document(width, height); this.current = next; this.path = undefined; }
  read(path: string): string {
    const result = this.storage.read(path); this.current = result.document; this.path = path;
    return [...result.warnings, `read ${path} (${result.document.all().length} elements)`].join('\n');
  }
  save(path?: string): string {
    const document = this.document; const target = path ?? this.path;
    if (!target) throw new Error('no file path. use save <file.svg>');
    this.storage.write(target, document); this.path = target;
    return `saved to ${target} (${document.all().length} elements)`;
  }
  undo(): string {
    this.document;
    if (this.barrier) throw new Error('undo not allowed after io command');
    const entry = this.undoStack.pop(); if (!entry) throw new Error('nothing to undo');
    entry.undo(this); this.redoStack.push(entry); return 'undone';
  }
  redo(): string {
    this.document;
    if (this.barrier) throw new Error('undo not allowed after io command');
    const entry = this.redoStack.pop(); if (!entry) throw new Error('nothing to redo');
    entry.redo(this); this.undoStack.push(entry); return 'redone';
  }
}
