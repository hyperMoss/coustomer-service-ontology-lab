/** Append-only fact history with grounded quotes and explicit corrections. */
export class FactLedger {
  #facts = [];
  #serial = 0;

  record({ issueId, kind, value, quote, sourceText, polarity = 'affirmed', subject = null, inputId }) {
    if (!issueId || !inputId) throw new TypeError('issueId and inputId are required');
    if (!['affirmed', 'negated', 'uncertain'].includes(polarity)) throw new TypeError('Invalid polarity');
    if (!quote || !sourceText?.includes(quote)) throw new TypeError('Fact quote must occur in the customer message');
    const fact = Object.freeze({ id: `fact-${++this.#serial}`, issueId, kind, value, quote, subject, polarity, inputId, revision: 1, status: 'active', supersedes: null });
    this.#facts.push(fact);
    return fact;
  }

  correct(factId, { value, quote, sourceText, inputId, polarity } = {}) {
    const index = this.#facts.findIndex(x => x.id === factId && x.status === 'active');
    if (index < 0) throw new Error('Active fact not found');
    if (!quote || !sourceText?.includes(quote)) throw new TypeError('Correction must quote current customer message');
    if (!inputId) throw new TypeError('inputId is required');
    const old = this.#facts[index];
    const isRetraction = value === null;
    if (!isRetraction && (!value || typeof value !== 'string')) throw new TypeError('Provide a replacement value or null to retract');
    if (polarity && !['affirmed', 'negated', 'uncertain'].includes(polarity)) throw new TypeError('Invalid polarity');
    this.#facts[index] = Object.freeze({ ...old, status: isRetraction ? 'retracted' : 'superseded' });
    if (isRetraction) return null;
    const updated = Object.freeze({ ...old, id: `fact-${++this.#serial}`, value, quote, inputId, revision: old.revision + 1, supersedes: old.id, status: 'active', polarity: polarity ?? old.polarity });
    this.#facts.push(updated);
    return updated;
  }

  active(issueId) { return this.#facts.filter(f => f.status === 'active' && (!issueId || f.issueId === issueId)); }
  history(issueId) { return this.#facts.filter(f => !issueId || f.issueId === issueId); }
}
