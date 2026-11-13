import './globals.css';

export const metadata = {
  title: 'Fanos Tender | Tenders and vehicle bids',
  description: 'Find active public, NGO, private, and vehicle bids in Ethiopia.',
  icons: {icon: '/fanos-tender-icon.svg'},
};

export default function RootLayout({children}) {
  return <html lang="en"><body>{children}</body></html>;
}

