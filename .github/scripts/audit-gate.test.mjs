import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advisoryKeys, newAdvisories } from './audit-gate.mjs';

// Shape of `npm audit --json` (v2): a vulnerability's `via` holds the advisory
// objects it owns, or plain package names when the risk is inherited.
const audit = (vulns) => ({ vulnerabilities: vulns });
const adv = (name, source, severity) => ({ source, name, severity, title: `${name} issue`, url: `https://github.com/advisories/GHSA-${source}` });

test('only high and critical advisories are tracked', () => {
  const keys = advisoryKeys(audit({
    a: { name: 'a', severity: 'high', via: [adv('a', 1, 'high')] },
    b: { name: 'b', severity: 'moderate', via: [adv('b', 2, 'moderate')] },
    c: { name: 'c', severity: 'critical', via: [adv('c', 3, 'critical')] },
    d: { name: 'd', severity: 'low', via: [adv('d', 4, 'low')] },
  }));
  assert.deepEqual([...keys].sort(), ['a|1', 'c|3']);
});

test('inherited risk is not double counted: only the package that owns the advisory is keyed', () => {
  const keys = advisoryKeys(audit({
    lib: { name: 'lib', severity: 'high', via: [adv('lib', 7, 'high')] },
    app: { name: 'app', severity: 'high', via: ['lib'] },
  }));
  assert.deepEqual([...keys], ['lib|7']);
});

test('an advisory already present on the base branch is not new', () => {
  const base = audit({ a: { name: 'a', severity: 'high', via: [adv('a', 1, 'high')] } });
  const head = audit({ a: { name: 'a', severity: 'high', via: [adv('a', 1, 'high')] } });
  assert.deepEqual(newAdvisories(base, head), []);
});

test('a high advisory that the head adds is reported with its details', () => {
  const base = audit({});
  const head = audit({ x: { name: 'x', severity: 'high', via: [adv('x', 9, 'high')] } });
  const found = newAdvisories(base, head);
  assert.equal(found.length, 1);
  assert.equal(found[0].key, 'x|9');
  assert.equal(found[0].severity, 'high');
  assert.match(found[0].url, /GHSA-9/);
});

test('a second advisory on an already-vulnerable package is new', () => {
  const base = audit({ a: { name: 'a', severity: 'high', via: [adv('a', 1, 'high')] } });
  const head = audit({ a: { name: 'a', severity: 'critical', via: [adv('a', 1, 'high'), adv('a', 2, 'critical')] } });
  assert.deepEqual(newAdvisories(base, head).map((f) => f.key), ['a|2']);
});

test('fixing advisories never fails the gate', () => {
  const base = audit({ a: { name: 'a', severity: 'high', via: [adv('a', 1, 'high')] } });
  assert.deepEqual(newAdvisories(base, audit({})), []);
});

test('a new moderate advisory does not fail the gate', () => {
  const head = audit({ m: { name: 'm', severity: 'moderate', via: [adv('m', 5, 'moderate')] } });
  assert.deepEqual(newAdvisories(audit({}), head), []);
});

test('a malformed audit report is an error, not a silent pass', () => {
  assert.throws(() => advisoryKeys({ error: { code: 'ENOAUDIT', summary: 'registry unreachable' } }), /audit/i);
  assert.throws(() => advisoryKeys(null), /audit/i);
});
