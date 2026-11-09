import { resolveProduct, retrieveKnowledge, evaluateDecision } from './ontology.mjs';
import { FactLedger } from './facts.mjs';
import { checkGate, IdempotentServiceOrderExecutor } from './actions.mjs';

const message = '我的 S1 Pro 扫地机（T2080）不吸了，我清理过滚刷，但还是不行，我想换货。';
const resolved = resolveProduct(message);
const facts = new FactLedger();
facts.record({ issueId: 'issue-1', kind: 'action_taken', value: '清理滚刷', quote: '我清理过滚刷', sourceText: message, inputId: 'msg-1' });
const decision = evaluateDecision({ product: resolved.product, warranty: 'VALID', dealer: 'AUTHORIZED', troubleshooting: 'USER_REPORTED_FAILED' });
// Mock-only assumptions: service eligibility, proof, human review, and customer confirmation have already been validated.
// Never derive these permissions from a text-only name match in a real service.
const gate = checkGate({ kind: 'replace', warranty: 'in_warranty', evidence: { order_or_receipt: true, address: true, photo_or_video: true, serial_number: true }, userConfirmed: true, caseStatus: 'approved', reviewPassed: true });
const executor = new IdempotentServiceOrderExecutor();
const first = await executor.submit({ key: 'demo-case-1:replace:v1', request: { type: 'replace', pn: resolved.product.id }, gate }, async (_request, key) => ({ serviceOrderNo: 'DEMO-001', clientRef: key }));
const again = await executor.submit({ key: 'demo-case-1:replace:v1', request: { type: 'replace', pn: resolved.product.id }, gate }, async () => { throw new Error('Should not create twice'); });

console.log(JSON.stringify({ product: { id: resolved.product.id, state: resolved.state }, knowledge: retrieveKnowledge(resolved.product.id, message).map(k => k.id), facts: facts.active('issue-1'), allowedActions: decision.allowed, simulatedGate: gate, simulatedSubmission: first, secondSubmission: again }, null, 2));
