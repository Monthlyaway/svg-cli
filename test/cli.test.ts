import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Tokenizer } from '../src/cli/Tokenizer.js';

const main = resolve('dist/src/cli/Main.js');
test('tokenizer keeps Windows backslashes, hex colors, empty text and quoted spaces', () => {
  const tokenizer = new Tokenizer();
  assert.deepEqual(tokenizer.tokenize('read "D:\\课程 作品\\a.svg"'),['read','D:\\课程 作品\\a.svg']);
  assert.deepEqual(tokenizer.tokenize('create text t 1 2 ""'),['create','text','t','1','2','']);
  assert.deepEqual(tokenizer.tokenize('set a fill #ffffff'),['set','a','fill','#ffffff']);
  assert.deepEqual(tokenizer.tokenize('  # comment'),[]);
  assert.deepEqual(tokenizer.tokenize('set t text "say \\"hi\\""'),['set','t','text','say "hi"']);
  assert.throws(() => tokenizer.tokenize('read "missing'),/unterminated/);
});
test('real script entry uses cwd, UTF-8, stop-on-error and nonzero exit status', () => {
  const directory = mkdtempSync(join(tmpdir(),'svg-cli-entry '));
  try {
    const script = join(directory,'demo.svgcli');
    writeFileSync(script,'\uFEFFinit 400 200\ncreate text title 20 40 "你好 SVG"\nsave "中文 drawing.svg"\n');
    const good = spawnSync(process.execPath,[main,'--script',script],{cwd:directory,encoding:'utf8'});
    assert.equal(good.status,0,good.stderr); assert.match(readFileSync(join(directory,'中文 drawing.svg'),'utf8'),/你好 SVG/); assert.doesNotMatch(good.stdout,/svg>/);
    writeFileSync(script,'init\ncreate rect bad 0 0 -1 2\ncreate g after\ntree\n');
    const bad = spawnSync(process.execPath,[main,'--script',script],{cwd:directory,encoding:'utf8'});
    assert.equal(bad.status,1); assert.match(bad.stderr,/^error: invalid width/m); assert.doesNotMatch(bad.stdout,/after/);
    const ttyProgram = `Object.defineProperty(process.stdin,'isTTY',{value:true});process.argv=${JSON.stringify([process.execPath,main,'--script',script])};await import(${JSON.stringify(pathToFileURL(main).href)});`;
    const tty = spawnSync(process.execPath,['--input-type=module','-e',ttyProgram],{cwd:directory,encoding:'utf8'});
    assert.equal(tty.status,1,'Script errors must return nonzero even when launched from an interactive terminal');
    const keep = spawnSync(process.execPath,[main,'--script',script,'--keep-going'],{cwd:directory,encoding:'utf8'});
    assert.equal(keep.status,1); assert.match(keep.stdout,/g#after/);
    const piped = spawnSync(process.execPath,[main],{input:'init\ncreate g a\nexit\ncreate g skipped\n',encoding:'utf8'});
    assert.equal(piped.status,0); assert.match(piped.stdout,/g#a/); assert.doesNotMatch(piped.stdout,/skipped/);
    for (const args of [['--help'],['--version']]) assert.equal(spawnSync(process.execPath,[main,...args]).status,0);
  } finally { rmSync(directory,{recursive:true,force:true}); }
});
