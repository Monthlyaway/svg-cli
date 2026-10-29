import type { DocumentStorage } from '../../src/ports/DocumentStorage.js';
import type { Document } from '../../src/domain/Document.js';
export class MemoryStorage implements DocumentStorage {
  private documents = new Map<string, Document>();
  read(path: string): { document: Document; warnings: string[] } {
    const document = this.documents.get(path); if (!document) throw new Error(`cannot read file: ${path}`);
    return { document: document.clone(), warnings: [] };
  }
  write(path: string, document: Document): void {
    if (path === 'fail.svg') throw new Error(`cannot write file: ${path}`);
    this.documents.set(path, document.clone());
  }
}
