import { createInterface } from 'node:readline';
import { readFileSync } from 'node:fs';
import { EditorSession } from '../application/EditorSession.js';
import { FileDocumentStorage } from '../infrastructure/FileDocumentStorage.js';
import { CommandParser } from './CommandParser.js';

export class Main {
  async run(args: string[]): Promise<void> {
    const version = (JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')) as {version: string}).version;
    if (args.length === 1 && args[0] === '--version') { console.log(`svg-cli ${version}`); return; }
    if (args.length === 1 && args[0] === '--help') { console.log('svg-cli [--script <file.svgcli> [--keep-going]]\nsvg-cli --version\nNo arguments: interactive editor or stdin commands.'); return; }
    const session = new EditorSession(new FileDocumentStorage()); const parser = new CommandParser();
    let failed = false;
    const execute = (line: string): boolean => {
      try { const command = parser.parse(line); if (command === 'exit') return false; if (command) console.log(session.run(command)); }
      catch (error) { console.error(`error: ${String(error instanceof Error ? error.message : error).replace(/[\r\n]+/g, ' ')}`); failed = true; }
      return true;
    };
    if (args.length) {
      if (args[0] !== '--script' || !args[1] || args.length > 3 || (args[2] !== undefined && args[2] !== '--keep-going')) throw new Error('usage: svg-cli [--script <file> [--keep-going]]');
      let text: string;
      try { text = readFileSync(args[1], 'utf8'); } catch { throw new Error(`cannot read script: ${args[1]}`); }
      const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
      for (const line of lines) { if (!execute(line) || (failed && args[2] !== '--keep-going')) break; }
    } else {
      const interactive = !!process.stdin.isTTY;
      const input = createInterface({ input: process.stdin, output: process.stdout, terminal: interactive });
      if (interactive) { console.log(`svg-editor ${version} — type 'help' for commands; exit to leave`); input.setPrompt('svg> '); input.prompt(); }
      for await (const line of input) { if (!execute(line)) { input.close(); break; } if (interactive) input.prompt(); }
    }
    if (failed && (args.length > 0 || !process.stdin.isTTY)) process.exitCode = 1;
  }
}
new Main().run(process.argv.slice(2)).catch(error => { console.error(`error: ${String(error instanceof Error ? error.message : error).replace(/[\r\n]+/g, ' ')}`); process.exitCode = 1; });
