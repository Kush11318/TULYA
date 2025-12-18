'use client'

import { useState, useEffect } from 'react'
import { verifyEmail, resendCode } from '@/app/actions/auth'
import { useAlert } from '@/components/providers/AlertProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useSearchParams } from 'next/navigation'

export default function VerifyEmailForm() {
    const searchParams = useSearchParams()
    const email = searchParams.get('email') || ''

    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const [cooldown, setCooldown] = useState(0)

    const alert = useAlert()

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [cooldown])

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const result = await verifyEmail(email, code)
        if (result?.error) {
            setError(result.error)
            alert.error(result.error)
            setLoading(false)
        }
    }

    async function handleResend() {
        if (cooldown > 0) return
        setError('')

        const result = await resendCode(email)
        if (result?.error) {
            setError(result.error)
            alert.error(result.error)
        } else {
            setCooldown(30)
            alert.success('Verification code resent successfully')
        }
    }

    return (
        <div className="space-y-4">
            <div className="text-sm text-gray-500 text-center">
                Enter the 6-digit code sent to <span className="font-medium text-black">{email}</span>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
                <Input
                    name="code"
                    placeholder="123456"
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                />

                {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                <Button type="submit" className="w-full" isLoading={loading}>
                    Verify
                </Button>
            </form>

            <div className="text-center">
                <Button
                    variant="secondary"
                    onClick={handleResend}
                    disabled={cooldown > 0}
                    type="button"
                >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </Button>
            </div>
        </div>
    )
}
