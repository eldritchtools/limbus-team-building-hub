import { useEffect, useMemo } from "react";
import { useRequestsCache } from "../database/RequestsCacheProvider";
import { useAuth } from "../database/authProvider";

export default function SaveButton({ buildId }) {
    const { user } = useAuth();
    const { savedMap, toggleSave, fetchUserData } = useRequestsCache();

    useEffect(() => { if (user) fetchUserData([buildId]) }, [fetchUserData, buildId, user]);
    const saved = useMemo(() => savedMap[buildId], [savedMap, buildId]);

    if (!user) return null;

    if (saved === undefined || saved === null) return null;

    return <button onClick={() => toggleSave(buildId)} className={saved ? "toggle-button-active" : "toggle-button"}>
        ⭐ {saved ? "Saved" : "Save"}
    </button>
}
