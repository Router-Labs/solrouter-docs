import { redirect } from 'next/navigation';

// Mirror Mintlify: the root redirects into the docs (introduction page).
export default function Home() {
  redirect('/docs');
}
