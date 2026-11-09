/**
 * Original educational implementation of a lightweight service ontology.
 * This is not a clone of OntoCare and contains no production customer data.
 */
export const products = Object.freeze([
  Object.freeze({ id: 'T2080', name: 'S1 Pro 扫地机', category: 'robot_vacuum', aliases: ['s1 pro robot', 's1 pro vacuum', '扫地机'] }),
  Object.freeze({ id: 'T8D04', name: 'S1 Pro 吸奶器', category: 'breast_pump', aliases: ['s1 pro breast pump', '吸奶器', '乳泵'] }),
  Object.freeze({ id: 'T2351', name: 'X10 Pro Omni', category: 'robot_vacuum', aliases: ['x10 pro omni', 'x10 pro'] })
]);

/** Synthetic troubleshooting entries; do not use as official repair instructions. */
export const knowledge = Object.freeze([
  { id: 'demo-kb-robot', appliesTo: 'T2080', tokens: ['滚刷', '吸力', 'robot', 'brush'], title: '扫地机吸力现象确认', summary: '核对扫地机型号与具体故障表现，必要时转人工。' },
  { id: 'demo-kb-pump', appliesTo: 'T8D04', tokens: ['吸奶', '吸力', 'pump', 'suction'], title: '吸奶器吸力现象确认', summary: '核对吸奶器型号与具体故障表现，必要时转人工。' },
  { id: 'demo-kb-x10', appliesTo: 'T2351', tokens: ['充电', 'charging', 'dock'], title: 'X10 充电现象确认', summary: '确认电源状态并参考相应官方手册。' }
]);

const PRODUCT_ID_PATTERN = /\bT[0-9A-Z]{4}\b/i;
const robotKeywords = /扫地|吸尘|滚刷|robot|vacuum|brush|dock/i;
const pumpKeywords = /吸奶|乳泵|pump|flange|breast/i;

/**
 * Resolve an explicit product identifier or a product label.
 * A matching order SKU associates a record with an item; it is NOT proof of customer ownership.
 */
export function resolveProduct(message, { orderSku } = {}) {
  const input = String(message ?? '');
  const id = String(orderSku || '').slice(0, 5).toUpperCase() || input.match(PRODUCT_ID_PATTERN)?.[0]?.toUpperCase();
  if (id) {
    const product = products.find(p => p.id === id);
    if (product) return { state: 'MATCHED', product, evidence: orderSku ? 'order_sku' : 'explicit_pn' };
  }
  if (/s1\s*pro/i.test(input)) {
    const isRobot = robotKeywords.test(input);
    const isPump = pumpKeywords.test(input);
    if (isRobot !== isPump) {
      return { state: 'PROBABLE', product: products.find(p => p.id === (isRobot ? 'T2080' : 'T8D04')), evidence: 'semantic_hint' };
    }
    return { state: 'CONFLICTED', product: null, candidates: products.filter(p => ['T2080', 'T8D04'].includes(p.id)), evidence: 'ambiguous_name' };
  }
  const matches = products.filter(p => p.aliases.some(alias => input.toLowerCase().includes(alias.toLowerCase())));
  if (matches.length === 1) return { state: 'PROBABLE', product: matches[0], evidence: 'alias' };
  return { state: matches.length ? 'CONFLICTED' : 'UNKNOWN', product: null, candidates: matches, evidence: 'no_unique_product' };
}

/** Product scope is checked BEFORE text similarity. */
export function retrieveKnowledge(productId, query) {
  if (!productId) return [];
  const text = String(query ?? '').toLowerCase();
  return knowledge.filter(k => k.appliesTo === productId && k.tokens.some(token => text.includes(token.toLowerCase())));
}

export function evaluateDecision({
  product = null,
  warranty = 'UNKNOWN',
  dealer = 'UNKNOWN',
  troubleshooting = 'NOT_STARTED',
  within30Days = false
} = {}) {
  const allowed = new Set();
  const forbidden = new Set(['direct_refund', 'execute_replacement']);
  const reasons = [];
  if (!product) {
    allowed.add('ask_product');
    reasons.push('产品未确认，不能进入具体售后办理。');
    return { allowed: [...allowed], forbidden: [...forbidden], reasons };
  }
  for (const item of ['search_knowledge', 'run_troubleshooting', 'escalate_human']) allowed.add(item);
  if (['UNKNOWN', 'PENDING_RECHECK'].includes(warranty)) {
    for (const item of ['request_proof', 'ask_seller', 'ask_country']) allowed.add(item);
    forbidden.add('tell_expired');
    reasons.push('UNKNOWN 不等于 EXPIRED，不能推断已过保。');
    return { allowed: [...allowed], forbidden: [...forbidden], reasons };
  }
  if (warranty === 'EXPIRED') {
    allowed.add('propose_paid_repair');
    reasons.push('演示规则：已过保，不提出免费换货资格。');
    return { allowed: [...allowed], forbidden: [...forbidden], reasons };
  }
  if (warranty !== 'VALID') throw new TypeError(`Unsupported warranty state: ${warranty}`);
  if (dealer === 'NOT_AUTHORIZED') {
    allowed.add('guide_contact_seller');
    reasons.push('非授权经销商，建议联系原购买渠道。');
  } else if (dealer === 'AUTHORIZED') {
    if (troubleshooting === 'FAILED') allowed.add('prepare_replacement_review');
    if (within30Days) allowed.add('prepare_return_review');
    if (troubleshooting === 'USER_REPORTED_FAILED') reasons.push('客户报告失败不等于已验证的排障失败。');
  }
  reasons.push('所有准备操作都仅供人工审核；没有真实退款或换货执行。');
  return { allowed: [...allowed], forbidden: [...forbidden], reasons };
}
