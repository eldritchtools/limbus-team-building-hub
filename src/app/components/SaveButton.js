import { useEffect, useMemo, useState } from "react";
import { useRequestsCache } from "../database/RequestsCacheProvider";
import { useAuth } from "../database/authProvider";
import { savesStore } from "../database/localDB";
import { SaveOutline, SaveSolid } from "./Symbols";

function NormalSaveButton({ buildId, user, buildEntryVersion, iconSize }) {
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

    if (buildEntryVersion) {
        return <div
            style={{ display: "flex", alignItems: "center", justifyContent: "center", color: loading ? "#aaa" : "#ddd", borderBottomRightRadius: "12px" }}
            onClick={loading ? null : handleClick}
        >
            {saved ? <SaveSolid text={"Saved"} size={iconSize} /> : <SaveOutline text={"Save"} size={iconSize} />}
        </div>
    } else {
        return <button onClick={handleClick} className={saved ? "toggle-button-active" : "toggle-button"} disabled={loading}>
            {saved ? <SaveSolid text={"Saved"} size={iconSize} /> : <SaveOutline text={"Save"} size={iconSize} />}
        </button>
    }
}

function isLocalId(id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return !uuidRegex.test(id);
}

function LocalSaveButton({ buildId, buildEntryVersion, iconSize }) {
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSaved = async () => {
            setSaved(await savesStore.get(buildId) !== undefined);
        }
        fetchSaved();
    }, [buildId]);

    if (isLocalId(buildId)) return null;

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

    if (buildEntryVersion) {
        return <div
            style={{ display: "flex", alignItems: "center", justifyContent: "center", color: loading ? "#aaa" : "#ddd", borderBottomRightRadius: "12px" }}
            onClick={loading ? null : handleClick}
        >
            {saved ? <SaveSolid text={"Saved"} size={iconSize} /> : <SaveOutline text={"Save"} size={iconSize} />}
        </div>
    } else {
        return <button onClick={handleClick} className={saved ? "toggle-button-active" : "toggle-button"} disabled={loading}>
            {saved ? <SaveSolid text={"Saved"} size={iconSize} /> : <SaveOutline text={"Save"} size={iconSize} />}
        </button>
    }
}

export default function SaveButton({ buildId, buildEntryVersion=false, iconSize }) {
    const { user } = useAuth();
    if (!user) return <LocalSaveButton buildId={buildId} buildEntryVersion={buildEntryVersion} iconSize={iconSize} />;
    else return <NormalSaveButton buildId={buildId} user={user} buildEntryVersion={buildEntryVersion} iconSize={iconSize} />

}
