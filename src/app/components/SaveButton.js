import { useEffect, useMemo, useState } from "react";
import { useRequestsCache } from "../database/RequestsCacheProvider";
import { useAuth } from "../database/authProvider";

export default function SaveButton({ buildId }) {
    const { user } = useAuth();
    const { savedMap, toggleSave, fetchUserData } = useRequestsCache();
    const [loading, setLoading] = useState(false);

    useEffect(() => { if (user) fetchUserData([buildId]) }, [fetchUserData, buildId, user]);
    const saved = useMemo(() => savedMap[buildId], [savedMap, buildId]);

    if (!user) return null;

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
