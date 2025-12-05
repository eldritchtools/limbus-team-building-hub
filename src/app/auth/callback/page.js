'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/database/authProvider';

export default function AuthCallback() {
    const router = useRouter();
    const { user, profile, loading, refreshProfile } = useAuth();

    useEffect(() => {
        // wait for AuthProvider to finish loading
        if (loading) return;

        // if still no user after loading, auth failed or expired
        if (!user) {
            router.replace('/login');
            return;
        }

        // If user has no profile, they’re new → setup flow
        if (!profile) {
            (async () => {
                await refreshProfile(); // make sure we didn’t just miss it
                router.replace('/login/setup');
            })();
            return;
        }

        // Otherwise, existing user → go home
        router.replace('/');
    }, [loading, user, profile, router, refreshProfile]);

    return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Authenticating...</p>;
}
