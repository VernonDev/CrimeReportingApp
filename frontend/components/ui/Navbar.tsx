'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-gray-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="text-xl font-bold text-white hover:text-gray-300">
          Crime Reporter
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/map" className="hover:text-gray-300 text-sm font-medium">
            Map
          </Link>

          {isAuthenticated ? (
            <>
              <Link href="/report/new" className="hover:text-gray-300 text-sm font-medium">
                Report
              </Link>
              <Link href="/dashboard" className="hover:text-gray-300 text-sm font-medium">
                Dashboard
              </Link>
              {(user?.role === 'moderator' || user?.role === 'admin') && (
                <Link href="/moderation" className="hover:text-gray-300 text-sm font-medium">
                  Moderation
                </Link>
              )}
              <button
                onClick={logout}
                className="text-sm font-medium text-gray-400 hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium hover:text-gray-300"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-3 py-1.5 bg-blue-600 rounded text-sm font-medium hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
