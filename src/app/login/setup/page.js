'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/database/authProvider';

export default function UsernameSetup() {
    const router = useRouter();
    const { user, profile, loading, updateUsername, refreshProfile } = useAuth();

    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (loading) {
        return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading user...</p>;
    }

    if (!user) {
        router.replace('/login');
        return null;
    }

    if (profile.username) {
        router.replace("/");
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim()) {
            setError('Username cannot be empty.');
            return;
        }

        setSubmitting(true);

        const { error } = await updateUsername(user.id, username);

        setSubmitting(false);

        if (error) {
            if (error.code === '23505') setError('That username is already taken.');
            else setError(error.message);
            return;
        }

        await refreshProfile();
        router.replace('/');
    };

    return (
        <main style={{ textAlign: 'center', marginTop: '3rem' }}>
            <h2>Set up your username</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    required
                />
                <button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Continue'}
                </button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </main>
    );
}
