'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/database/authProvider';
import { buildsStore, listsStore, savesStore } from '@/app/database/localDB';
import { useRequestsCache } from '@/app/database/RequestsCacheProvider';
import { insertBuild } from '@/app/database/builds';
import { insertCuratedList } from '@/app/database/curatedLists';

export default function UsernameSetup() {
    const router = useRouter();
    const { user, profile, loading, updateUsername, refreshProfile } = useAuth();
    const { toggleSave } = useRequestsCache();

    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [localBuilds, setLocalBuilds] = useState([]);
    const [localSaves, setLocalSaves] = useState([]);
    const [localLists, setLocalLists] = useState([]);
    const [buildSyncCancelled, setBuildSyncCancelled] = useState(false);
    const [saveSyncCancelled, setSaveSyncCancelled] = useState(false);
    const [listSyncCancelled, setListSyncCancelled] = useState(false);
    const [localLoading, setLocalLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const fetchLocal = async () => {
        setLocalBuilds(await buildsStore.getAll());
        setLocalSaves(await savesStore.getAll());
        setLocalLists(await listsStore.getAll());
        setLocalLoading(false);
    }

    useEffect(() => {
        fetchLocal();
    }, []);

    if (loading) {
        return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading user...</p>;
    }

    if (!user) {
        router.replace('/login');
        return null;
    }

    const handleSubmitUsername = async (e) => {
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
    };

    if (!profile.username) {
        return <main style={{ textAlign: 'center', marginTop: '3rem' }}>
            <h2>Set up your username</h2>
            <form onSubmit={handleSubmitUsername}>
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
        </main>;
    }

    if (localLoading) {
        return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Checking for local data...</p>;
    }

    if (localBuilds.length !== 0 && !buildSyncCancelled) {
        const handleSyncBuilds = async () => {
            setSyncing(true);
            setError("");
            for (const build of localBuilds) {
                const { id, title, body, identity_ids, ego_ids, keyword_ids, deployment_order, active_sinners, team_code, youtube_video_id, tags, extra_opts, block_discovery } = build;
                try {
                    const data = await insertBuild(user.id, title, body, identity_ids, ego_ids, keyword_ids, deployment_order, active_sinners, team_code, youtube_video_id, tags, extra_opts, block_discovery, false);
                    if (data) await buildsStore.remove(id);
                } catch (err) {
                    setError("Failed to sync a build, try again or cancel syncing.");
                    setSyncing(false);
                    break;
                }
            }
            setSyncing(false);
            await fetchLocal();
        }

        return <main style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", textAlign: 'center', marginTop: '3rem' }}>
            <span style={{ fontSize: "1.2rem" }}>
                Some local drafts were found on your device. Would you like to sync them to your account?
                <br />
                Local drafts that are not synced cannot be accessed while logged in.
            </span>
            <div style={{ display: "flex", gap: "2rem", justifyContent: "center" }}>
                <button onClick={handleSyncBuilds} disabled={syncing}>
                    Sync Builds
                </button>
                <button onClick={() => setBuildSyncCancelled(true)} disabled={syncing}>
                    Don&apos;t Sync
                </button>
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </main>;
    }

    if (localSaves.length !== 0 && !saveSyncCancelled) {
        const handleSyncSaves = async () => {
            setSyncing(true);
            setError("");
            for (const save of localSaves) {
                const { id } = save;
                try {
                    await toggleSave(id)
                    await savesStore.remove(id);
                } catch (err) {
                    setError("Failed to sync a save, try again or cancel syncing.");
                    setSyncing(false);
                    break;
                }
            }
            setSyncing(false);
            await fetchLocal();
        }

        return <main style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", textAlign: 'center', marginTop: '3rem' }}>
            <span style={{ fontSize: "1.2rem" }}>
                Some local saved builds were found on your device. Would you like to sync them to your account?
                <br />
                Local saved builds that are not synced cannot be accessed while logged in.
            </span>
            <div style={{ display: "flex", gap: "2rem" }}>
                <button onClick={handleSyncSaves} disabled={syncing}>
                    Sync Saved Builds
                </button>
                <button onClick={() => setSaveSyncCancelled(true)} disabled={syncing}>
                    Don&apos;t Sync
                </button>
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </main>;
    }

    if (localLists.length !== 0 && !listSyncCancelled) {
        const handleSyncLists = async () => {
            setSyncing(true);
            setError("");
            for (const list of localLists) {
                const { id, title, body, short_desc, items, tags, block_discovery } = list;
                try {
                    const trimmedBuilds = items.map(({ build, note }) => ({ build_id: build.id, note: note }));
                    const data = await insertCuratedList(title, body, short_desc, trimmedBuilds, tags, block_discovery, false);
                    if (data) await listsStore.remove(id);
                } catch (err) {
                    setError("Failed to sync a curated list, try again or cancel syncing.");
                    setSyncing(false);
                    break;
                }
            }
            setSyncing(false);
            await fetchLocal();
        }

        return <main style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", textAlign: 'center', marginTop: '3rem' }}>
            <span style={{ fontSize: "1.2rem" }}>
                Some local curated lists were found on your device. Would you like to sync them to your account?
                <br />
                Local curated lists that are not synced cannot be accessed while logged in.
            </span>
            <div style={{ display: "flex", gap: "2rem" }}>
                <button onClick={handleSyncLists} disabled={syncing}>
                    Sync Curated Lists
                </button>
                <button onClick={() => setListSyncCancelled(true)} disabled={syncing}>
                    Don&apos;t Sync
                </button>
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </main>;
    }

    router.replace("/");
    return null;
}
