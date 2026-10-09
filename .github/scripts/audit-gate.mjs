#!/usr/bin/env node
// Fail a pull request that adds a NEW high or critical production-dependency
// advisory. Advisories already present on the base branch never fail the gate,
// so existing debt does not block unrelated work, but it cannot grow.
//
//   node audit-gate.mjs --base origin/main --dirs dev/backend,dev/frontend
//   node audit-gate.mjs --dirs dev/backend --report        # no base: summary only
//
// Only directories whose package.json or package-lock.json changed against the
// base are audited, so a PR that touches no dependencies never depends on the
// npm registry being reachable.
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TRACKED = new Set(['high', 'critical']);

/** Keys `name|advisoryId` of every high or critical advisory in an `npm audit --json` report. */
export function advisoryKeys(report) {
  return new Set(advisories(report).map((a) => a.key));
}

function advisories(report) {
  if (!report || typeof report !== 'object' || !report.vulnerabilities || typeof report.vulnerabilities !== 'object') {
    const why = report?.error?.summary || report?.error?.code || 'no vulnerabilities field';
    throw new Error(`npm audit returned an unusable report (${why})`);
  }
  const found = new Map();
  for (const vuln of Object.values(report.vulnerabilities)) {
    for (const via of vuln.via ?? []) {
      // A string is inherited risk from another package; the owner holds the object.
      if (typeof via !== 'object' || via === null || !TRACKED.has(via.severity)) continue;
      const key = `${via.name ?? vuln.name}|${via.source}`;
      if (!found.has(key)) found.set(key, { key, name: via.name ?? vuln.name, severity: via.severity, title: via.title, url: via.url });
    }
  }
  return [...found.values()];
}

/** High or critical advisories present in `head` and absent from `base`. */
export function newAdvisories(base, head) {
  const before = advisoryKeys(base);
  return advisories(head).filter((a) => !before.has(a.key));
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function npmAudit(dir) {
  // npm audit exits non-zero when it finds anything; the JSON on stdout is what we want.
  try {
    return JSON.parse(execFileSync('npm', ['audit', '--omit=dev', '--package-lock-only', '--json'], { cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }));
  } catch (e) {
    if (e.stdout) return JSON.parse(e.stdout);
    throw e;
  }
}

function changed(base, dir) {
  const files = [`${dir}/package.json`, `${dir}/package-lock.json`];
  try {
    git('diff', '--quiet', `${base}...HEAD`, '--', ...files);
    return false;
  } catch {
    return true;
  }
}

function baseAudit(base, dir) {
  const tmp = mkdtempSync(join(tmpdir(), 'audit-base-'));
  try {
    for (const f of ['package.json', 'package-lock.json']) {
      let content;
      try {
        content = git('show', `${base}:${dir}/${f}`);
      } catch {
        return { vulnerabilities: {} }; // the directory is new in this PR: everything it brings is new
      }
      mkdirSync(tmp, { recursive: true });
      writeFileSync(join(tmp, f), content);
    }
    return npmAudit(tmp);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function summary(lines) {
  console.log(lines.join('\n'));
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
}

function main() {
  const dirs = (arg('--dirs') ?? '.').split(',').map((d) => d.trim()).filter(Boolean);
  const base = arg('--base');
  const report = process.argv.includes('--report') || !base;
  const out = ['### Dependency audit (production dependencies, high and critical)', ''];
  let failed = false;

  for (const dir of dirs) {
    if (!report && !changed(base, dir)) {
      out.push(`- \`${dir}\`: dependencies unchanged, skipped`);
      continue;
    }
    const head = npmAudit(dir);
    if (report) {
      const all = advisories(head);
      out.push(`- \`${dir}\`: ${all.length} high or critical advisories (${all.filter((a) => a.severity === 'critical').length} critical)`);
      continue;
    }
    const added = newAdvisories(baseAudit(base, dir), head);
    if (!added.length) {
      out.push(`- \`${dir}\`: no new high or critical advisories`);
      continue;
    }
    failed = true;
    out.push(`- \`${dir}\`: **${added.length} new**`);
    for (const a of added) out.push(`  - ${a.severity} \`${a.name}\`: ${a.title} ${a.url ?? ''}`);
  }
  summary(out);
  if (failed) {
    console.error('\nThis change adds high or critical advisories to production dependencies. Upgrade or replace the package, or explain in the PR why it cannot be done.');
    process.exit(1);
  }
}

// Run only when executed directly. Compare real paths: a symlinked cwd (macOS /tmp) breaks a plain string match.
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main();
