export class Tokenizer {
  tokenize(line: string): string[] {
    if (line.trimStart().startsWith('#')) return [];
    const tokens: string[] = []; let value = ''; let quoted = false; let started = false;
    for (let i = 0; i < line.length; i++) {
      const character = line[i]!;
      if (character === '"') { quoted = !quoted; started = true; }
      else if (quoted && character === '\\' && ['"','\\'].includes(line[i+1] ?? '')) { value += line[++i]; started = true; }
      else if (/\s/.test(character) && !quoted) { if (started) { tokens.push(value); value = ''; started = false; } }
      else { value += character; started = true; }
    }
    if (quoted) throw new Error('unterminated double quote');
    if (started) tokens.push(value);
    return tokens;
  }
}
