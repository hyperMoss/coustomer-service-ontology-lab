/**
 * Original, compact demonstration of haike-inspired execution safeguards.
 * Real deployments need durable database transactions, human approvals and backend idempotency.
 */
const requirements = Object.freeze({
  replace: ['order_or_receipt', 'address', 'photo_or_video', 'serial_number'],
  refund: ['order_or_receipt', 'address', 'photo_or_video', 'serial_number'],
  reship: ['order_or_receipt'],
  carrier_investigation: ['order_or_receipt']
});

export function checkGate({
  kind,
  warranty = 'unknown',
  logisticsOk = false,
  evidence = {},
  userConfirmed = false,
  allowedOperations = true,
  reportedSafetyRisk = false,
  caseStatus = 'waiting_info',
  executionStatus = null,
  reviewPassed = false
}) {
  if (!(kind in requirements)) throw new TypeError('Unknown action kind');
  const eligibility = ['replace', 'refund'].includes(kind) ? warranty === 'in_warranty' : logisticsOk;
  const missing = requirements[kind].filter(field => !evidence[field]);
  const checks = [
    { name: 'eligibility', passed: eligibility },
    { name: 'evidence', passed: missing.length === 0 && userConfirmed, missing },
    { name: 'safety', passed: allowedOperations && !reportedSafetyRisk },
    { name: 'idempotency', passed: !['running', 'succeeded'].includes(executionStatus) && ['approved', 'awaiting_confirmation', 'executing_failed'].includes(caseStatus) },
    { name: 'review', passed: reviewPassed }
  ];
  return { passed: checks.every(c => c.passed), checks, fallback: checks.every(c => c.passed) ? null : 'await_human' };
}

export class IdempotentServiceOrderExecutor {
  #records = new Map();

  async submit({ key, request, gate }, create) {
    if (!key || !request) throw new TypeError('An idempotency key and request are required');
    if (!gate?.passed || gate.checks?.length !== 5 || !gate.checks.every(c => c.passed)) throw new Error('AuthorizationDenied');
    const serialized = JSON.stringify(request);
    const existing = this.#records.get(key);
    if (existing) {
      if (existing.serialized !== serialized) throw new Error('IdempotencyConflict');
      if (existing.status === 'succeeded') return { ...existing.result, replayed: true };
      throw new Error(existing.status === 'running' ? 'ExecutionBusy' : 'OutcomeUnverified');
    }
    const record = { serialized, status: 'running' };
    this.#records.set(key, record);
    try {
      const result = await create(request, key);
      record.status = 'succeeded';
      record.result = { status: 'submitted', receipt: result };
      return { ...record.result, replayed: false };
    } catch (cause) {
      // Treat even an apparent network failure as an unknown outcome until reconciled.
      record.status = 'unknown';
      throw new Error('OutcomeUnverified', { cause });
    }
  }
  status(key) { return this.#records.get(key)?.status ?? null; }
}
