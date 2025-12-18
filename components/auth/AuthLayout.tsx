import Link from 'next/link'

export default function AuthLayout({
    children,
    title,
    subtitle,
}: {
    children: React.ReactNode
    title: string
    subtitle?: string
}) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white text-black">
            <div className="w-full max-w-[380px] space-y-8">
                <div className="text-center space-y-2">
                    <Link href="/" className="inline-block">
                        <h1 className="text-2xl font-semibold tracking-tight">PriceLens</h1>
                    </Link>
                    <p className="text-sm text-gray-500">Focus on value. Blur the noise.</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-1 text-center">
                        <h2 className="text-xl font-medium">{title}</h2>
                        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                    </div>
                    {children}
                </div>
            </div>
        </div>
    )
}
