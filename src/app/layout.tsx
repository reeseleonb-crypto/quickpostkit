import './globals.css';

export const metadata = {
  title: 'QuickPostKit',
  description: 'Generate 30-day social content kits for $5',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
