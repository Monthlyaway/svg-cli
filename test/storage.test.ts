import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { FileDocumentStorage } from '../src/infrastructure/FileDocumentStorage.js';
import { Document } from '../src/domain/Document.js';
import { ShapeFactory } from '../src/domain/ShapeFactory.js';

const codec = new SvgCodec(); const wrap = (body: string, attrs = ''): string => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" ${attrs}>${body}</svg>`;
test('SVG missing IDs reserve explicit names ahead and roundtrip escaped UTF-8', () => {
  const first = codec.decode(wrap('<g><rect/><rect id="rect1" x="2"/><text id="t" x="5" y="6">中文 &amp; &lt; &quot;Hi&quot;</text><circle/><ellipse/><line/></g>'));
  assert.ok(first.warnings.includes('warning: assigned id rect2 to unnamed <rect>'));
  assert.equal(first.document.require('t').content,'中文 & < "Hi"');
  first.document.require('t').set('text', '中文\n"quoted"\t & < >');
  const xml = codec.encode(first.document); assert.equal(codec.encode(codec.decode(xml).document),xml);
  assert.equal(first.document.require('line1').attributes().has('stroke'),false);
  assert.match(codec.decode(wrap('<g id="box" data-kind="box"><rect id="r"/></g>')).warnings[0]!,/plain g/);
});
test('malformed, duplicate, unsafe and unsupported XML are rejected explicitly', () => {
  for (const xml of ['<svg>',wrap('<rect id="x"/><g id="x"/>'),wrap('<path id="p"/>'),wrap('<g id="g" transform="translate(2,3)"/>'),wrap('<text id="t"><tspan>text</tspan></text>'),wrap('<rect id="r" onclick="bad"/>'),wrap('<rect id="r" width="-1"/>'),wrap('<rect id="r" fill="url(https://example.com)"/>'),wrap('<rect id="r"/>','viewBox="1 1 4 3"'),'<!DOCTYPE svg [<!ENTITY a "hi">]>'+wrap(''), wrap('<rect id="r" a="1" a="2"/>'),wrap('<foreign xmlns="other"/>')]) assert.throws(() => codec.decode(xml),xml);
});
test('disk adapter overwrites atomically, supports spaces and cleans temporary files on failure', () => {
  const directory = mkdtempSync(join(tmpdir(),'svg-cli-中文 '));
  try {
    const storage = new FileDocumentStorage(); const path = join(directory,'my drawing.svg'); const doc = new Document();
    doc.add(new ShapeFactory().create('text','t',['1','2','你好'])); storage.write(path,doc); storage.write(path,doc);
    assert.equal(storage.read(path).document.require('t').content,'你好'); assert.equal(readFileSync(path,'utf8'),codec.encode(doc));
    assert.throws(() => storage.write(directory,doc),/cannot write file/);
    assert.deepEqual(readdirSync(directory),['my drawing.svg']);
    assert.throws(() => storage.read(join(directory,'missing.svg')), /cannot read file/);
  } finally { rmSync(directory,{recursive:true,force:true}); }
});
