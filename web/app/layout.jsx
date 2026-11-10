import { Public_Sans, Source_Serif_4 } from 'next/font/google';

const sans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata = {
  title: 'Bid Ethiopia | Tenders and vehicle bids',
  description: 'Find active public, NGO, private, and vehicle bids in Ethiopia.',
};

export default function RootLayout({children}) {
  return <html lang="en" className={sans.variable + ' ' + serif.variable}>
    <body className={sans.className} style={{margin: 0}}>{children}</body>
  </html>;
}
