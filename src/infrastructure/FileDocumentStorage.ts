import { readFileSync, writeFileSync, renameSync, unlinkSync, statSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname, basename, join } from 'node:path';
import type { DocumentStorage } from '../ports/DocumentStorage.js';
import type { Document } from '../domain/Document.js';
import { SvgCodec } from './SvgCodec.js';
export class FileDocumentStorage implements DocumentStorage {
  private readonly codec = new SvgCodec();
  read(path: string): ReturnType<SvgCodec['decode']> {
    let text: string;
    try {
      if (statSync(path).size > 5 * 1024 * 1024) throw new Error();
      text = readFileSync(path, 'utf8');
    } catch { throw new Error(`cannot read file: ${path}`); }
    return this.codec.decode(text);
  }
  write(path: string, document: Document): void {
    const xml = this.codec.encode(document);
    const temporary = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
    try { writeFileSync(temporary, xml, { encoding: 'utf8', flag: 'wx' }); renameSync(temporary, path); }
    catch { throw new Error(`cannot write file: ${path}`); }
    finally { try { unlinkSync(temporary); } catch { /* Rename consumed it, or writing failed before creation. */ } }
  }
}
