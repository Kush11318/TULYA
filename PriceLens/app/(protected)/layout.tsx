import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import TopNav from '@/components/layout/TopNav';

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
        redirect('/login');
    }

    const user = await db.user.findUnique({
        where: { id: sessionToken },
        select: { name: true },
    });

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="flex min-h-screen flex-col">
            <TopNav userName={user.name} />
            <main className="flex-1">{children}</main>
        </div>
    );
}
