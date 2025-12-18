import AuthLayout from '@/components/auth/AuthLayout'
import VerifyEmailForm from '@/components/auth/VerifyEmailForm'
import { Suspense } from 'react'

export default function VerifyEmailPage() {
    return (
        <AuthLayout title="Check your email">
            <Suspense fallback={<div>Loading...</div>}>
                <VerifyEmailForm />
            </Suspense>
        </AuthLayout>
    )
}
