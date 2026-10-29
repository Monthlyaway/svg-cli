import test from 'node:test';
import assert from 'node:assert/strict';
import { EditorSession } from '../src/application/EditorSession.js';
import { CommandParser } from '../src/cli/CommandParser.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { MemoryStorage } from './support/MemoryStorage.js';

const parser = new CommandParser(); const codec = new SvgCodec();
const run = (s: EditorSession, line: string): string => { const cmd = parser.parse(line); assert.ok(cmd && cmd !== 'exit'); return s.run(cmd); };
test('one editing command is one history unit, views skip history and branching drops redo', () => {
  const s = new EditorSession(new MemoryStorage());
  assert.throws(() => run(s,'tree'), /no document/); run(s,'help'); run(s,'init');
  run(s,'create rect a 1 2 3 4'); run(s,'create circle b 4 5 6'); const before = codec.encode(s.document);
  run(s,'group pair b a'); run(s,'tree'); run(s,'show a'); run(s,'canvas'); run(s,'undo'); assert.equal(codec.encode(s.document), before);
  run(s,'redo'); assert.equal(s.document.require('pair').children.length, 2);
  run(s,'delete pair'); run(s,'undo'); assert.equal(s.document.all().length, 3);
  run(s,'move pair 10 -5'); assert.throws(() => run(s,'redo'), /nothing to redo/);
});
test('all failing edits leave document AND both history stacks unchanged', () => {
  const s = new EditorSession(new MemoryStorage()); run(s,'init'); run(s,'create g outer');
  run(s,'create rect a 1 2 3 4 in outer'); run(s,'create circle b 0 0 1 in outer'); run(s,'undo');
  const before = codec.encode(s.document);
  for (const command of ['create rect a 0 0 1 1','create circle bad 0 0 1 in absent','create circle bad 0 0 1 in a','group bad outer a','ungroup outer','addto outer outer','set a width -2','set a id changed','scale a 0','move a NaN 1','create box n 0 0 1 1','create g ""']) {
    assert.throws(() => run(s, command), command); assert.equal(codec.encode(s.document), before, command);
  }
  run(s,'redo'); assert.equal(s.document.require('b').tag, 'circle');
  run(s,'create circle huge 1e308 0 1 in outer'); const partial = codec.encode(s.document);
  assert.throws(() => run(s,'scale outer 10')); assert.equal(codec.encode(s.document), partial);
  run(s,'undo'); assert.equal(s.document.has('huge'), false);
});
test('successful IO resets history, failed IO preserves it, save remembers target', () => {
  const s = new EditorSession(new MemoryStorage()); run(s,'init 200'); assert.equal(s.document.height,600);
  run(s,'create rect a 1 2 3 4'); assert.throws(() => run(s,'save'), /no file path/);
  assert.throws(() => run(s,'save fail.svg')); assert.throws(() => run(s,'read missing.svg'));
  run(s,'undo'); assert.equal(s.document.all().length,0); run(s,'redo'); run(s,'save ok.svg');
  for (const command of ['undo','redo']) assert.throws(() => run(s,command), /undo not allowed after io command/);
  run(s,'move a 2 3'); run(s,'save'); run(s,'move a 1 1'); run(s,'read ok.svg');
  assert.equal(s.document.require('a').attributes().get('x'),'3');
  run(s,'move a 2 2'); run(s,'canvas 300 200'); assert.throws(() => run(s,'undo'), /io command/);
  run(s,'set a fill blue'); run(s,'undo'); assert.equal(s.document.require('a').attributes().has('fill'),false);
});
test('deterministic regression: nested edits survive undo-all then redo-all', () => {
  const s = new EditorSession(new MemoryStorage()); run(s,'init'); const empty = codec.encode(s.document);
  const commands = ['create g scene','create g node in scene','create rect r 1.5 -2 30 40 in node','create text t 4 20 "A & B" in node', 'create line edge 0 0 30 40 black in scene', 'create ellipse e 30 40 5 7 red', 'addto scene e', 'front edge', 'back node', 'group nested e edge','ungroup nested', 'set scene stroke blue','set t text "改名"','scale scene 0.5','move scene -10 15'];
  for (let i = 0; i < 20; i++) commands.push(`move r ${i % 3 - 1} ${i % 5 - 2}`);
  commands.forEach(c => run(s,c)); const final = codec.encode(s.document);
  commands.forEach(() => run(s,'undo')); assert.equal(codec.encode(s.document),empty);
  commands.forEach(() => run(s,'redo')); assert.equal(codec.encode(s.document),final);
});
