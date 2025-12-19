'use server'

import { db } from '@/lib/db'
import { generateOtp, hashOtp, verifyOtpHash } from '@/lib/otp'
import { sendVerificationEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function registerUser(formData: FormData) {
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!name || !email || !password || !confirmPassword) {
        return { error: 'All fields are required' }
    }

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match' }
    }

    try {
        const existingUser = await db.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            // If user exists but verify is false, we could resend, but for now just error
            if (!existingUser.emailVerified) {
                // Optionally logic to allowing reusing the account if unverified
                // For now simplest path:
                return { error: 'User already exists. Please login.' }
            }
            return { error: 'User already exists' }
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        })

        const otp = await generateOtp()
        const hashedOtp = await hashOtp(otp)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 mins

        await db.otp.create({
            data: {
                code: hashedOtp,
                expiresAt,
                userId: user.id,
            },
        })

        await sendVerificationEmail(email, otp);
    } catch (error) {
        console.error('Registration Error:', error);
        return { error: 'Something went wrong. Please try again.' };
    }

    redirect(`/verify-email?email=${encodeURIComponent(email)}&registered=1`);
}

export async function verifyEmail(email: string, code: string) {
    if (!email || !code) return { error: 'Missing email or code' }

    try {
        const user = await db.user.findUnique({
            where: { email },
        })

        if (!user) return { error: 'User not found' }

        // In a real scenario with many OTps, this logic finds the *latest* valid one usually.
        // Ideally we sort by createdAt desc
        const otps = await db.otp.findMany({
            where: { userId: user.id, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' }
        })

        let match = false
        for (const o of otps) {
            if (await verifyOtpHash(code, o.code)) {
                match = true
                break
            }
        }

        if (!match) {
            return { error: 'Invalid or expired code' }
        }

        await db.user.update({
            where: { id: user.id },
            data: { emailVerified: true }
        })

        // Cleanup OTPs
        await db.otp.deleteMany({
            where: { userId: user.id }
        })

    } catch (error) {
        console.error(error);
        return { error: 'Verification failed' };
    }

    redirect('/login?verified=1');
}

export async function loginUser(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) return { error: 'All fields required' }

    const user = await db.user.findUnique({ where: { email } })

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return { error: 'Invalid credentials' }
    }

    if (!user.emailVerified) {
        // Generate new OTP?
        redirect(`/verify-email?email=${encodeURIComponent(email)}`)
    }

    // Set session... (Using "Login" as just success for now as we don't have NextAuth/Session logic specified fully)
    // Spec says: "CTA: Log in. If email not verified -> redirect. Else...?"
    // Assuming successful login just redirects to dashboard or home?

    // Minimal auth usually implies a cookie. I will set a dummy cookie or just redirect to home.
    // Since "No secrets in code" and "Ready for production later", I should probably use a simple cookie or just return success.
    // I'll just redirect to '/' for now.

    // Set session cookie
    cookies().set('session_token', user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
    })

    redirect('/?welcome=1')
}

export async function resendCode(email: string) {
    if (!email) return { error: 'Email required' }

    try {
        const user = await db.user.findUnique({ where: { email } })
        if (!user) return { error: 'User not found' }

        // Rate limit check: Find last OTP
        const lastOtp = await db.otp.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        })

        if (lastOtp && (Date.now() - lastOtp.createdAt.getTime() < 30000)) {
            return { error: 'Please wait 30 seconds before resending' }
        }

        const otp = await generateOtp()
        const hashedOtp = await hashOtp(otp)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

        await db.otp.create({
            data: {
                code: hashedOtp,
                expiresAt,
                userId: user.id
            }
        })

        await sendVerificationEmail(email, otp)
        return { success: true }

    } catch (e) {
        return { error: 'Failed to resend' }
    }
}

export async function logoutUser() {
    cookies().delete({
        name: 'session_token',
        path: '/',
    });
    return { success: true };
}

