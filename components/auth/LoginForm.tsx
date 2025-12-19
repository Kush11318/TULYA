'use client'

import { useState } from 'react'
import { loginUser } from '@/app/actions/auth'
import { useAlert } from '@/components/providers/AlertProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'

export default function LoginForm() {
    const [error, setError] = useState<string>('')
    const [loading, setLoading] = useState(false)

    const alert = useAlert()

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(event.currentTarget)
        const result = await loginUser(formData)

        if (result?.error) {
            setError(result.error)
            alert.error(result.error)
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Input name="email" type="email" placeholder="Email" required />
                <Input name="password" type="password" placeholder="Password" required />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" isLoading={loading}>
                Log in
            </Button>

            <div className="text-center text-sm">
                <span className="text-gray-500">Don't have an account? </span>
                <Link href="/register" className="font-medium underline underline-offset-4 hover:text-gray-900">
                    Sign up
                </Link>
            </div>
        </form>
    )
}
