import { useEffect, useMemo, useState } from "react";
import { useRequestsCache } from "../database/RequestsCacheProvider";
import { useAuth } from "../database/authProvider";
import { savesStore } from "../database/localDB";

function NormalSaveButton({ buildId, user }) {
    const { savedMap, toggleSave, fetchUserData } = useRequestsCache();
    const [loading, setLoading] = useState(false);

    useEffect(() => { if (user) fetchUserData([buildId]) }, [fetchUserData, buildId, user]);
    const saved = useMemo(() => savedMap[buildId], [savedMap, buildId]);

    if (saved === undefined || saved === null) return null;

    const handleClick = async () => {
        setLoading(true);
        await toggleSave(buildId);
        setLoading(false);
    };

    return <button onClick={handleClick} className={saved ? "toggle-button-active" : "toggle-button"} disabled={loading}>
        ⭐ {saved ? "Saved" : "Save"}
    </button>
}

function isLocalId(id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return !uuidRegex.test(id);
}

function LocalSaveButton({ buildId }) {
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSaved = async () => {
            setSaved(await savesStore.get(buildId) !== undefined);
        }
        fetchSaved();
    }, [buildId]);

    if(isLocalId(buildId)) return null;

    const handleClick = async () => {
        setLoading(true);
        if (saved) {
            await savesStore.remove(buildId);
            setSaved(false);
        } else {
            await savesStore.save({ id: buildId });
            setSaved(true);
        }
        setLoading(false);
    };

    return <button onClick={handleClick} className={saved ? "toggle-button-active" : "toggle-button"} disabled={loading}>
        ⭐ {saved ? "Saved" : "Save"}
    </button>
}

export default function SaveButton({ buildId }) {
    const { user } = useAuth();
    if (!user) return <LocalSaveButton buildId={buildId} />;
    else return <NormalSaveButton buildId={buildId} user={user} />

}
