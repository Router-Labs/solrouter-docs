import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Instrument_Serif, DM_Sans, JetBrains_Mono } from 'next/font/google';

// Brand fonts from docs.solrouter.com: Instrument Serif (display), DM Sans (body), JetBrains Mono (code).
const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-instrument',
});
const dm = DM_Sans({ subsets: ['latin'], variable: '--font-dm' });
const jb = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jb' });

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${instrument.variable} ${dm.variable} ${jb.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        {/* Brand is dark-first editorial; toggle + OS preference still work. */}
        <RootProvider theme={{ defaultTheme: 'dark', enableSystem: true }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
