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
        if (searchParams.get('welcome')) {
            alert.success('Welcome back!');
            // Remove query param without refreshing
            const params = new URLSearchParams(searchParams);
            params.delete('welcome');
            router.replace(`${pathname}?${params.toString()}`);
        }
    }, [searchParams, pathname, router, alert]);

    return null;
}
