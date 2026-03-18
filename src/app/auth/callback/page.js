'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/database/authProvider';
import { buildsStore, listsStore, mdPlansStore, savedListsStore, savedMdPlansStore, savesStore } from '@/app/database/localDB';

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
        if (!profile || !profile.username || profile.username.trim().length === 0) {
            (async () => {
                router.replace('/login/setup');
            })();
            return;
        }

        const checkLocalData = async () => {
            const builds = await buildsStore.getAll();
            const saves = await savesStore.getAll();
            const lists = await listsStore.getAll();
            const savedLists = await savedListsStore.getAll();
            const mdPlans = await mdPlansStore.getAll();
            const savedMdPlans = await savedMdPlansStore.getAll();

            if (builds.length !== 0 || saves.length !== 0 || lists.length !== 0 || savedLists.length !== 0 || mdPlans.length !== 0 || savedMdPlans.length !== 0) {
                (async () => {
                    router.replace('/login/setup');
                })();
                return;
            }

            finishAuth();
        }

        const finishAuth = () => {
            // Otherwise, existing user → go home
            const searchParams = new URLSearchParams(window.location.search);
            const state = searchParams.get('state');
            router.replace(state || '/');
        }

        checkLocalData();
    }, [loading, user, profile, router, refreshProfile]);

    return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Authenticating...</p>;
}
