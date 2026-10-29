import { Document } from '../domain/Document.js';
export interface DocumentStorage {
  read(path: string): { document: Document; warnings: readonly string[] };
  write(path: string, document: Document): void;
}
