export type PageStatus = 'live' | 'soon' | 'archived' | 'mixed';

const LABEL: Record<PageStatus, string> = {
  live: 'Live',
  soon: 'Soon',
  archived: 'Archived',
  mixed: 'Mixed',
};

const MEANING: Record<PageStatus, string> = {
  live: 'This page describes what runs in production today.',
  soon: 'The code exists, but this surface is not published or not confirmed end to end.',
  archived: 'This feature was removed or disabled. The page stays to explain the change.',
  mixed: 'See the Status column in the tables on this page.',
};

export function statusLabel(status: PageStatus): string {
  return LABEL[status];
}

/** One or two plain sentences that appear under the page description and in llms output. */
export function statusSentence(input: {
  status?: PageStatus;
  checked?: string;
  statusNote?: string;
}): string | null {
  if (!input.status) return null;
  const parts = [`Status: ${LABEL[input.status]}.`];
  parts.push(input.statusNote ? input.statusNote.trim().replace(/\.?$/, '.') : MEANING[input.status]);
  if (input.checked) parts.push(`Checked against code and api.solrouter.com on ${input.checked}.`);
  return parts.join(' ');
}
