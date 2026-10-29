import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { SvgCodec } from '../dist/src/infrastructure/SvgCodec.js';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'artifacts/acceptance'); mkdirSync(output, {recursive:true});
const cases = [
  ['01-first-drawing.svgcli','first-drawing.svg',2, d => assert.equal(d.require('title').attributes().get('x'),'70')],
  ['02-flowchart.svgcli','flowchart.svg',9, d => { assert.equal(d.require('process').attributes().get('y'),'100'); assert.equal(d.require('process-label').content,'处理数据 v2'); }],
  ['03-status-board.svgcli','status-board.svg',10, d => { assert.equal(d.has('badge'),false); assert.ok(Math.abs(Number(d.require('status').attributes().get('cx')) - 86.1) < 1e-10); }],
  ['04-floor-plan.svgcli','floor-plan.svg',12, d => { assert.equal(d.require('desk').attributes().get('x'),'91'); assert.equal(d.parentLabel(d.require('plant')),'g#details'); }],
];
for (const [script, file, count, verify] of cases) {
  const result = spawnSync(process.execPath,[resolve(root,'dist/src/cli/Main.js'),'--script',resolve(root,'examples',script)],{cwd:output,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr); writeFileSync(resolve(output,`${file}.transcript.txt`),result.stdout);
  const xml = readFileSync(resolve(output,file),'utf8'); const codec = new SvgCodec(); const doc = codec.decode(xml).document;
  assert.equal(doc.all().length,count,script); verify(doc); assert.equal(codec.encode(doc),xml,`roundtrip: ${script}`);
  const golden = resolve(root,'examples/expected',file);
  if (process.argv.includes('--update')) { mkdirSync(resolve(root,'examples/expected'),{recursive:true}); writeFileSync(golden,xml); }
  else assert.equal(xml,readFileSync(golden,'utf8'),`visual fixture changed: ${file}; review before --update`);
  console.log(`PASS ${script} -> ${file} (${count} elements, roundtrip and semantic checks)`);
}
