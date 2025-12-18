'use client';

import { useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useAlert } from '@/components/providers/AlertProvider';

export default function LoginSuccessAlert() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const alert = useAlert();

    useEffect(() => {
        if (!searchParams) return;

        const params = new URLSearchParams(searchParams);
        let changed = false;

        if (params.get('welcome')) {
            alert.success('Welcome back!');
            params.delete('welcome');
            changed = true;
        }

        if (params.get('logout')) {
            alert.success('You have been logged out.');
            params.delete('logout');
            changed = true;
        }

        if (params.get('registered')) {
            alert.success('Account created. We’ve sent you a verification code.');
            params.delete('registered');
            changed = true;
        }

        if (params.get('verified')) {
            alert.success('Email verified. You can now log in.');
            params.delete('verified');
            changed = true;
        }

        if (changed) {
            const queryString = params.toString();
            const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
            router.replace(newUrl);
        }
    }, [searchParams, pathname, router, alert]);

    return null;
}
