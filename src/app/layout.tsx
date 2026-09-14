import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import { SITE } from '@/lib/shared';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'Solrouter Docs', template: '%s | Solrouter Docs' },
};

// Fonts match solrouter.com: DM Sans (headings and body), JetBrains Mono (code).
const dm = DM_Sans({ subsets: ['latin'], variable: '--font-dm' });
const jb = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jb' });

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${dm.variable} ${jb.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=new URLSearchParams(location.search).get('theme');if(t==='light'||t==='dark')localStorage.setItem('theme',t)}catch(e){}",
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        {/* Light by default, like solrouter.com. The landing passes ?theme= so a
            visitor who switched to dark there stays in dark here. */}
        <RootProvider theme={{ defaultTheme: 'light', enableSystem: false }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
