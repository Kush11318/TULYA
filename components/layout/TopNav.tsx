'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutUser } from '@/app/actions/auth';
import { useAlert } from '@/components/providers/AlertProvider';

// Define the navigation items
const NAV_ITEMS = [
    { label: 'Search', href: '/' },
    { label: 'Compare', href: '/compare' },
    { label: 'About', href: '/about' },
    { label: 'Help', href: '/help' },
];

export default function TopNav({ userName }: { userName?: string }) {
    const pathname = usePathname();
    const alert = useAlert();

    const handleLogout = async () => {
        try {
            await logoutUser();
            alert.success('Logged out successfully');
        } catch (e) {
            alert.error('Failed to logout');
        }
    };

    return (
        <nav className="h-[56px] w-full border-b border-sky-100 bg-[#E0F7FA]/30 flex items-center justify-between px-6 sticky top-0 z-40 backdrop-blur-sm">
            {/* Left: Logo */}
            <div className="flex items-center gap-2 group cursor-pointer">
                <Link href="/" className="text-lg font-medium tracking-tight">
                    PriceLens
                </Link>
                <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Focus on value
                </span>
            </div>

            {/* Center: Tabs */}
            <div className="hidden md:flex items-center gap-8">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                text-sm transition-colors duration-200 relative py-1
                ${isActive ? 'text-black font-medium' : 'text-gray-500 hover:text-black'}
              `}
                        >
                            {item.label}
                            {/* Subtle underline for hover/active */}
                            <span className={`absolute bottom-0 left-0 w-full h-[1px] bg-sky-200 transform origin-left transition-transform duration-300
                 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}
              `}></span>
                        </Link>
                    );
                })}
            </div>

            {/* Right: User & Logout */}
            <div className="flex items-center gap-6">
                {userName && (
                    <span className="text-sm text-gray-600 font-light hidden sm:block">
                        Welcome, <span className="font-normal text-black">{userName}</span>
                    </span>
                )}
                <button
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}
