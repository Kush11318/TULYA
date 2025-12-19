'use client'

import { useState } from 'react'
import { registerUser } from '@/app/actions/auth'
import { useAlert } from '@/components/providers/AlertProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'

export default function RegisterForm() {
    const alert = useAlert()
    const [error, setError] = useState<string>('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(event.currentTarget)
        const result = await registerUser(formData)

        if (result?.error) {
            setError(result.error)
            alert.error(result.error)
            setLoading(false)
        }
        // If success, registerUser redirects
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Input name="name" placeholder="Name" required />
                <Input name="email" type="email" placeholder="Email" required />
                <Input name="password" type="password" placeholder="Password" required />
                <Input name="confirmPassword" type="password" placeholder="Confirm Password" required />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" isLoading={loading}>
                Create account
            </Button>

            <div className="text-center text-sm">
                <span className="text-gray-500">Already have an account? </span>
                <Link href="/login" className="font-medium underline underline-offset-4 hover:text-gray-900">
                    Log in
                </Link>
            </div>
        </form>
    )
}
