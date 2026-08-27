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

/** A short note under the description, shown only when a page is not fully Live. */
export function statusSentence(input: {
  status?: PageStatus;
  checked?: string;
  statusNote?: string;
}): string | null {
  if (!input.status || input.status === 'live') return null;
  return input.statusNote
    ? input.statusNote.trim().replace(/\.?$/, '.')
    : MEANING[input.status];
}
