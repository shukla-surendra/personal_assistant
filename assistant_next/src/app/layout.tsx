import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Assistant Next',
  description: 'Notion-like Task and Note Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white`}>
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-64 bg-gray-900 text-white">
            <div className="p-4">
              <h1 className="text-xl font-bold">Assistant Next</h1>
            </div>
            <nav className="mt-4">
              <div className="px-4 py-2 text-gray-400">Workspace</div>
              <a href="/" className="block px-4 py-2 text-white hover:bg-gray-800">
                Home
              </a>
              <a href="/dashboard" className="block px-4 py-2 text-white hover:bg-gray-800">
                Dashboard
              </a>
              <div className="px-4 py-2 text-gray-400">Pages</div>
              <a href="/tasks" className="block px-4 py-2 text-white hover:bg-gray-800">
                Tasks
              </a>
              <a href="/notes" className="block px-4 py-2 text-white hover:bg-gray-800">
                Notes
              </a>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
} 