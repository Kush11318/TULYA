'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutUser } from '@/app/actions/auth';
import { useAlert } from '@/components/providers/AlertProvider';
import DarkModeToggle from '@/app/components/DarkModeToggle';

const NAV_ITEMS = [
    { label: 'Search', href: '/' },
    { label: 'Compare', href: '/compare' },
    { label: 'About', href: '/about' },
    { label: 'Help', href: '/help' },
];

function isActivePath(pathname: string, href: string) {
    if (href === '/') {
        return pathname === '/' || pathname.startsWith('/results');
    }
    return pathname.startsWith(href);
}

export default function TopNav({ userName }: { userName?: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const alert = useAlert();

    const handleLogout = async () => {
        try {
            await logoutUser();
            alert.success('You have been logged out.');
            // Force hard redirect to clear all client state
            window.location.href = '/login?logout=1';
        } catch {
            alert.error('Failed to logout');
        }
    };

    return (
        <nav className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-[rgba(59,130,246,0.25)] bg-[rgba(59,130,246,0.15)] px-6 backdrop-blur-sm dark:bg-slate-900/80 dark:border-slate-800">
            {/* Left: Logo */}
            <div className="flex cursor-pointer items-center gap-2">
                <Link
                    href="/"
                    className="text-lg font-medium tracking-tight text-sky-900 transition-colors hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                >
                    PriceLens
                </Link>
            </div>

            {/* Center: Tabs */}
            <div className="hidden items-center gap-8 md:flex">
                {NAV_ITEMS.map((item) => {
                    const active = isActivePath(pathname, item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            className={`relative py-1 text-sm transition-colors duration-200 outline-none ${active
                                ? 'text-sky-900 font-medium dark:text-sky-400'
                                : 'text-slate-600 hover:text-sky-900 focus-visible:text-sky-900 dark:text-slate-400 dark:hover:text-sky-400'
                                }`}
                        >
                            {item.label}
                            <span
                                className={`absolute inset-x-0 -bottom-0.5 h-[2px] origin-left transform rounded-full bg-sky-500 transition-transform duration-200 ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                                    }`}
                            />
                        </Link>
                    );
                })}
            </div>

            {/* Right: User & Logout */}
            <div className="flex items-center gap-6">
                <DarkModeToggle />
                {userName && (
                    <span className="hidden text-sm font-light text-slate-700 sm:block dark:text-slate-300">
                        Welcome, <span className="font-normal text-sky-900 dark:text-sky-400">{userName}</span>
                    </span>
                )}
                <button
                    type="button"
                    onClick={handleLogout}
                    className="text-sm text-sky-700 transition-colors hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:text-gray-400 dark:hover:text-white"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}
