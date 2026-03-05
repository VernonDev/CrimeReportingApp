import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Community Crime Reporter</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl">
        Help keep your community safe by reporting crimes and suspicious activity. View reports on
        an interactive map to stay informed about local safety.
      </p>
      <div className="flex gap-4">
        <Link
          href="/map"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          View Crime Map
        </Link>
        <Link
          href="/report/new"
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          Report a Crime
        </Link>
      </div>
    </div>
  );
}
