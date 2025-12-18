import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import TopNav from '@/components/layout/TopNav'
import LoginSuccessAlert from '@/components/auth/LoginSuccessAlert'

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get('session_token')?.value

    if (!sessionToken) {
        redirect('/login')
    }

    const user = await db.user.findUnique({
        where: { id: sessionToken },
        select: { name: true }
    })

    // Should we redirect if user not found? Yes.
    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex flex-col min-h-screen">
            <LoginSuccessAlert />
            <TopNav userName={user.name} />
            <main className="flex-1">
                {children}
            </main>
        </div>
    )
}
