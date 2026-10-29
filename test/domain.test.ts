import test from 'node:test';
import assert from 'node:assert/strict';
import { Document } from '../src/domain/Document.js';
import { ShapeFactory } from '../src/domain/ShapeFactory.js';

const factory = new ShapeFactory();
test('six polymorphic shapes move and scale geometry, group style stays inherited', () => {
  const doc = new Document(); doc.add(factory.create('g', 'scene'));
  for (const [type, args] of [['rect', ['1','2','3','4']], ['circle', ['1','2','3']], ['ellipse', ['1','2','3','4']], ['line', ['1','2','3','4']], ['text', ['1','2','hello']]] as const) doc.add(factory.create(type, type, args), 'scene');
  doc.require('scene').move(10, 20); doc.require('scene').scale(2); doc.require('scene').set('fill', 'red');
  assert.equal(doc.require('rect').attributes().get('x'), '22');
  assert.equal(doc.require('circle').attributes().get('r'), '6');
  assert.equal(doc.require('line').attributes().get('x2'), '26');
  assert.equal(doc.require('text').content, 'hello');
  assert.equal(doc.require('rect').attributes().has('fill'), false);
  assert.equal(doc.require('scene').attributes().get('fill'), 'red');
});
test('group preserves document order, rejects cycles, ungroup replaces nested slot', () => {
  const doc = new Document();
  doc.add(factory.create('g','outer')); doc.add(factory.create('rect','a',['0','0','1','1']), 'outer'); doc.add(factory.create('circle','b',['0','0','1']), 'outer');
  doc.group('inner', ['b','a']); assert.deepEqual(doc.require('inner').children.map(s => s.id), ['a','b']);
  assert.throws(() => doc.group('bad', ['inner','a']), /own descendant: inner/);
  assert.throws(() => doc.addTo('inner','outer'), /own descendant/);
  assert.throws(() => doc.ungroup('outer'), /top-level/);
  doc.ungroup('inner'); assert.deepEqual(doc.require('outer').children.map(s => s.id), ['a','b']);
  doc.reorder('a',true); assert.deepEqual(doc.require('outer').children.map(s => s.id), ['b','a']);
  const copy = doc.clone(); doc.delete('outer'); assert.equal(copy.all().length, 3); assert.equal(doc.all().length, 0);
});
test('geometry validates finite numbers and whitelists attributes', () => {
  assert.throws(() => factory.create('box','x'), /unknown shape type/);
  assert.throws(() => factory.create('rect','x',['0','0','-1','3']), /invalid width/);
  const rect = factory.create('rect','x',['0','0','1','3']);
  for (const value of ['NaN', 'Infinity', '0x20', '1px', '']) assert.throws(() => rect.set('x',value));
  assert.throws(() => rect.set('onclick','alert(1)'), /unknown attribute/);
  assert.throws(() => rect.scale(0), /must be positive/);
  assert.throws(() => rect.set('fill','url(https://example.com)'), /unsupported paint/);
});
