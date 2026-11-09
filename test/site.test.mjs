import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, sep } from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const pages=['index.html','lessons/0001-ontology-through-s1-pro.html','lessons/0002-ontocare-dual-ontology.html','lessons/0003-haike-fact-to-action.html','reference/ontology-cheatsheet.html','reference/dual-ontology-decision-table.html','reference/haike-execution-cheatsheet.html'];

test('every standalone page exists and links to existing local assets',async()=>{
  let count=0;
  for(const page of pages){
    const html=await readFile(join(root,page),'utf8');
    assert.match(html,/<html/i, page);
    const attr=/(?:href|src)="([^"]+)"/g;
    for(const [,url] of html.matchAll(attr)){
      if(/^(https?:|mailto:|#)/.test(url))continue;
      const clean=url.split(/[?#]/,1)[0];
      const target=resolve(root,dirname(page),clean);
      assert.ok(target.startsWith(root+sep)||target===root,`Out of root: ${page} -> ${url}`);
      await stat(target);
      count++;
    }
  }
  assert.ok(count>20,`Expected multiple local links; saw ${count}`);
});
