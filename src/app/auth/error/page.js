'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function AuthErrorPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const description = searchParams.get('message') || 'An authentication error occurred.';

    useEffect(() => {
        // Redirect back home after a short delay
        const timer = setTimeout(() => router.push('/'), 4000);
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <main style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Authentication Error</h2>
                <p style={styles.text}>{description}</p>
                <p style={styles.subtext}>Redirecting you back to the homepage...</p>
            </div>
        </main>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1f1f1f',
        color: '#ddd',
    },
    card: {
        background: '#2a2a2a',
        border: '1px solid #555',
        borderRadius: '12px',
        padding: '2rem',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        textAlign: 'center',
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: 600,
        marginBottom: '1rem',
    },
    text: {
        fontSize: '1rem',
        marginBottom: '0.5rem',
    },
    subtext: {
        fontSize: '0.875rem',
        color: '#aaa',
    },
};
