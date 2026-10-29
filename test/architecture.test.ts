import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, relative, basename } from 'node:path';

test('production imports obey layer boundaries and each concrete class has its own file', () => {
  const root = resolve('src');
  const allowed: Record<string, string[]> = { domain:['domain'], ports:['ports','domain'], application:['application','ports','domain'], infrastructure:['infrastructure','ports','domain'], cli:['cli','application','domain','infrastructure'] };
  const walk = (directory: string): string[] => readdirSync(directory,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(resolve(directory,item.name)):[resolve(directory,item.name)]);
  for(const file of walk(root).filter(f=>f.endsWith('.ts'))) {
    const text = readFileSync(file,'utf8'); const layer = relative(root,file).split(/[\\/]/)[0]!;
    for(const match of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const dependency = match[1]!;
      if(dependency.startsWith('.')) {
        const target = relative(root,resolve(file,'..',dependency)).split(/[\\/]/)[0]!;
        assert.ok(allowed[layer]?.includes(target),`${relative(root,file)} -> ${dependency}`);
      } else assert.ok(['infrastructure','cli'].includes(layer),`External dependency in ${file}: ${dependency}`);
    }
    const classes = [...text.matchAll(/export\s+(?:abstract\s+)?class\s+(\w+)/g)];
    assert.ok(classes.length<=1,`Multiple classes in ${file}`);
    if(classes[0]) assert.equal(classes[0][1],basename(file,'.ts'));
    assert.doesNotMatch(text,/\bswitch\s*\(/,`Use polymorphism: ${file}`);
  }
});
