import './style.css';

export const metadata = {
  title: 'Bid Ethiopia | Tenders and vehicle bids',
  description: 'Find active public, NGO, private, and vehicle bids in Ethiopia.',
};

export default function RootLayout({children}) {
  return <html lang="en"><body>{children}</body></html>;
}
