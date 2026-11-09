import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveProduct, retrieveKnowledge, evaluateDecision } from '../src/ontology.mjs';
import { FactLedger } from '../src/facts.mjs';
import { checkGate, IdempotentServiceOrderExecutor } from '../src/actions.mjs';

const enoughEvidence = { order_or_receipt: true, address: true, photo_or_video: true, serial_number: true };
const eligibleGate = () => checkGate({kind:'replace',warranty:'in_warranty',evidence:enoughEvidence,userConfirmed:true,caseStatus:'approved',reviewPassed:true});

test('ambiguous S1 Pro stays unresolved', () => {
  const r = resolveProduct('我的 S1 Pro 不吸了');
  assert.equal(r.state, 'CONFLICTED');
  assert.equal(r.product, null);
});
test('semantic hints only produce a probable product', () => {
  const r = resolveProduct('S1 Pro 扫地机滚刷不工作');
  assert.equal(r.product.id, 'T2080');
  assert.equal(r.state, 'PROBABLE');
});
test('exact product code has precedence', () => {
  assert.equal(resolveProduct('T8D04 吸力不足').product.id, 'T8D04');
});
test('no cross-product knowledge leakage', () => {
  assert.deepEqual(retrieveKnowledge('T2080', '滚刷 吸力').map(k=>k.id), ['demo-kb-robot']);
  assert.deepEqual(retrieveKnowledge('T8D04', '滚刷').map(k=>k.id), []);
});
test('unknown warranty is never treated as expired', () => {
  const d = evaluateDecision({product:resolveProduct('T2080').product,warranty:'UNKNOWN'});
  assert.ok(d.allowed.includes('request_proof'));
  assert.ok(d.forbidden.includes('tell_expired'));
});
test('user-reported failure does not automatically become verified failure', () => {
  const base={product:resolveProduct('T2080').product,warranty:'VALID',dealer:'AUTHORIZED'};
  assert.ok(!evaluateDecision({...base,troubleshooting:'USER_REPORTED_FAILED'}).allowed.includes('prepare_replacement_review'));
  assert.ok(evaluateDecision({...base,troubleshooting:'FAILED'}).allowed.includes('prepare_replacement_review'));
});
test('fact needs a verbatim customer quote', () => {
  const ledger = new FactLedger();
  assert.throws(() => ledger.record({issueId:'i',kind:'symptom',value:'冒烟',quote:'正在冒烟',sourceText:'没有冒烟',inputId:'m1'}), /quote/);
});
test('a correction preserves superseded fact and new version', () => {
  const ledger = new FactLedger();
  const first=ledger.record({issueId:'i',kind:'symptom',value:'左侧不工作',quote:'左边坏了',sourceText:'左边坏了',inputId:'m1'});
  const revised=ledger.correct(first.id,{value:'右侧不工作',quote:'我说错了，是右边坏了',sourceText:'我说错了，是右边坏了',inputId:'m2'});
  assert.equal(revised.revision, 2);
  assert.equal(revised.supersedes, first.id);
  assert.equal(ledger.history('i')[0].status, 'superseded');
  assert.equal(ledger.active('i')[0].value, '右侧不工作');
});
test('missing evidence or changed customer request fails the gate', () => {
  const missing=checkGate({kind:'replace',warranty:'in_warranty',evidence:{order_or_receipt:true},userConfirmed:true,caseStatus:'approved',reviewPassed:true});
  assert.equal(missing.passed,false);
  assert.ok(missing.checks.find(c=>c.name==='evidence').missing.includes('address'));
  const changed=checkGate({kind:'replace',warranty:'in_warranty',evidence:enoughEvidence,userConfirmed:true,caseStatus:'approved',reviewPassed:false});
  assert.equal(changed.passed,false);
});
test('all five checks pass for a fully eligible, approved demo action', () => assert.equal(eligibleGate().passed,true));
test('execution state running or succeeded blocks a new request', () => {
  assert.equal(checkGate({kind:'replace',warranty:'in_warranty',evidence:enoughEvidence,userConfirmed:true,caseStatus:'approved',reviewPassed:true,executionStatus:'running'}).passed,false);
  assert.equal(checkGate({kind:'replace',warranty:'in_warranty',evidence:enoughEvidence,userConfirmed:true,caseStatus:'approved',reviewPassed:true,executionStatus:'succeeded'}).passed,false);
});
test('same key and same request returns the cached receipt', async () => {
  const executor = new IdempotentServiceOrderExecutor();
  let calls=0;
  const submit=(type)=>executor.submit({key:'case-1:action-1:v1',request:{type},gate:eligibleGate()},async()=>({id:`DEMO-${++calls}`}));
  const first=await submit('replace');
  const replay=await submit('replace');
  assert.equal(calls,1);
  assert.equal(replay.replayed,true);
  assert.deepEqual(first.receipt,replay.receipt);
  await assert.rejects(submit('refund'),/IdempotencyConflict/);
});
test('unknown submission outcome is not automatically retried', async () => {
  const executor = new IdempotentServiceOrderExecutor();
  let calls=0;
  const args={key:'case-2:action-1:v1',request:{type:'replace'},gate:eligibleGate()};
  await assert.rejects(executor.submit(args,async()=>{calls++;throw new Error('timeout')}),/OutcomeUnverified/);
  await assert.rejects(executor.submit(args,async()=>{calls++;return {id:'bad'}}),/OutcomeUnverified/);
  assert.equal(calls,1);
});
