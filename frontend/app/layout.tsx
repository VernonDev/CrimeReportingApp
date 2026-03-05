import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import Navbar from '@/components/ui/Navbar';

export const metadata: Metadata = {
  title: 'Crime Reporter',
  description: 'Community crime reporting application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
