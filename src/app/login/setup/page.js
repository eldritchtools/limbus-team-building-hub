'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/database/authProvider';
import { buildsStore, listsStore, mdPlansStore, savedListsStore, savedMdPlansStore, savesStore } from '@/app/database/localDB';
import { useRequestsCache } from '@/app/database/RequestsCacheProvider';
import { insertBuild } from '@/app/database/builds';
import { createMdPlan } from '@/app/database/mdPlans';
import { insertCollection } from '@/app/database/collections';

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
    const [localSavedLists, setLocalSavedLists] = useState([]);
    const [localMdPlans, setLocalMdPlans] = useState([]);
    const [localSavedMdPlans, setLocalSavedMdPlans] = useState([]);

    const [buildSync, setBuildSync] = useState(true);
    const [saveSync, setSaveSync] = useState(true);
    const [listSync, setListSync] = useState(true);
    const [savedListSync, setSavedListSync] = useState(true);
    const [planSync, setPlanSync] = useState(true);
    const [savedPlanSync, setSavedPlanSync] = useState(true);

    const [syncDone, setSyncDone] = useState(false);
    const [localLoading, setLocalLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const fetchLocal = async () => {
        setLocalBuilds(await buildsStore.getAll());
        setLocalSaves(await savesStore.getAll());
        setLocalLists(await listsStore.getAll());
        setLocalSavedLists(await savedListsStore.getAll());
        setLocalMdPlans(await mdPlansStore.getAll());
        setLocalSavedMdPlans(await savedMdPlansStore.getAll());
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


    if (!syncDone && (localBuilds.length !== 0 || localSaves.length !== 0 || localLists.length !== 0 || localSavedLists.length !== 0 || localMdPlans.length !== 0 || localSavedMdPlans.length !== 0)) {
        const handleSync = async () => {
            setSyncing(true);
            setError("");

            if (buildSync && localBuilds.length > 0) {
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
            }

            if (saveSync && localSaves.length > 0) {
                for (const save of localSaves) {
                    const { id } = save;
                    try {
                        await toggleSave("build", id)
                        await savesStore.remove(id);
                    } catch (err) {
                        setError("Failed to sync a build save, try again or cancel syncing.");
                        setSyncing(false);
                        break;
                    }
                }
            }

            if (listSync && localLists.length > 0) {
                for (const list of localLists) {
                    const { id, title, body, short_desc, items, tags, block_discovery } = list;
                    try {
                        const trimmedItems = items.map(({ type, data, note, submitted_by }) => {
                            const result = { target_type: type, target_id: data.id, note };
                            if (submitted_by) result.submitted_by = submitted_by;
                            return result;
                        });
                        const data = await insertCollection(title, body, short_desc, trimmedItems, "closed", tags, block_discovery, false);
                        if (data) await listsStore.remove(id);
                    } catch (err) {
                        setError("Failed to sync a collection, try again or cancel syncing.");
                        setSyncing(false);
                        break;
                    }
                }
            }

            if (savedListSync && localSavedLists.length > 0) {
                for (const save of localSavedLists) {
                    const { id } = save;
                    try {
                        await toggleSave("collection", id)
                        await savedListsStore.remove(id);
                    } catch (err) {
                        setError("Failed to sync a saved collection, try again or cancel syncing.");
                        setSyncing(false);
                        break;
                    }
                }
            }

            if (planSync && localMdPlans.length > 0) {
                for (const plan of localMdPlans) {
                    try {
                        const {builds: builds, ...planData} = plan
                        planData.build_ids = builds.map(build => build.id);
                        const data = await createMdPlan(planData);
                        if (data) await mdPlansStore.remove(plan.id);
                    } catch (err) {
                        setError("Failed to sync an md plan, try again or cancel syncing.");
                        setSyncing(false);
                        break;
                    }
                }
            }

            if (savedPlanSync && localSavedMdPlans.length !== 0) {
                for (const save of localSavedMdPlans) {
                    try {
                        const { id } = save;
                        await toggleSave("md_plan", id);
                        await savedMdPlansStore.remove(id);
                    } catch (err) {
                        setError("Failed to sync an md plan save, try again or cancel syncing.");
                        setSyncing(false);
                        break;
                    }
                }
            }

            setSyncing(false);
            await fetchLocal();
        }

        return <main style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", textAlign: 'center', marginTop: '3rem' }}>
            <span style={{ fontSize: "1.2rem" }}>
                Local data was found on your device. Would you like to sync them to your account?
                <br />
                Unsynced data cannot be accessed while logged in.
                <br /><br />
                Choose what data to sync:
            </span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "start", gap: "0.2rem" }}>
                {
                    localBuilds.length !== 0 ?
                        <label>
                            <input type="checkbox" checked={buildSync} onChange={e => setBuildSync(e.target.checked)} />
                            Builds
                        </label> :
                        null
                }
                {
                    localSaves.length !== 0 ?
                        <label>
                            <input type="checkbox" checked={saveSync} onChange={e => setSaveSync(e.target.checked)} />
                            Saved Builds
                        </label> :
                        null
                }
                {
                    localLists.length !== 0 ?
                        <label>
                            <input type="checkbox" checked={listSync} onChange={e => setListSync(e.target.checked)} />
                            Collections
                        </label> :
                        null
                }
                {
                    localSavedLists.length !== 0 ?
                        <label>
                            <input type="checkbox" checked={savedListSync} onChange={e => setSavedListSync(e.target.checked)} />
                            Saved Collections
                        </label> :
                        null
                }
                {
                    localMdPlans.length !== 0 ?
                        <label>
                            <input type="checkbox" checked={planSync} onChange={e => setPlanSync(e.target.checked)} />
                            MD Plans
                        </label> :
                        null
                }
                {
                    localSavedMdPlans.length !== 0 ?
                        <label>
                            <input type="checkbox" checked={savedPlanSync} onChange={e => setSavedPlanSync(e.target.checked)} />
                            Saved MD Plans
                        </label> :
                        null
                }
            </div>
            <div style={{ display: "flex", gap: "2rem", justifyContent: "center" }}>
                <button onClick={handleSync} disabled={syncing}>
                    Sync Data
                </button>
                <button onClick={() => setSyncDone(true)} disabled={syncing}>
                    Don&apos;t Sync
                </button>
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </main>;
    }

    router.replace("/");
    return null;
}
