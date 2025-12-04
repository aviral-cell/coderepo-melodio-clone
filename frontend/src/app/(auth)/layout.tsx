import { Music } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-spotify-dark-gray to-spotify-black px-4 py-8">
      <div className="mb-8 flex items-center gap-2">
        <Music className="h-10 w-10 text-spotify-green" />
        <span className="text-3xl font-bold text-white">Hackify</span>
      </div>
      {children}
    </div>
  );
}
