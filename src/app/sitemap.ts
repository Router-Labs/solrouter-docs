import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { SITE } from '@/lib/shared';

export const revalidate = false;

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = source.getPages().map((page) => ({
    url: new URL(page.url, SITE).toString(),
    lastModified: page.data.checked ? new Date(page.data.checked) : undefined,
  }));

  return [{ url: `${SITE}/` }, { url: `${SITE}/llms.txt` }, ...pages];
}
