import { useEffect, useState } from "react";
import { useRequestsCache } from "../database/RequestsCacheProvider";
import { useAuth } from "../database/authProvider";
import { LikeOutline, LikeSolid } from "./Symbols";


export default function LikeButton({ buildId, likeCount, buildEntryVersion = false, iconSize }) {
    const { user } = useAuth();
    const { likedMap, toggleLike, fetchUserData } = useRequestsCache();
    const [count, setCount] = useState(likeCount);
    const [loading, setLoading] = useState(false);

    useEffect(() => { if (user) fetchUserData([buildId]) }, [fetchUserData, buildId, user]);
    const liked = useMemo(() => likedMap[buildId], [likedMap, buildId]);
    const text = count === 1 ? "1 Like" : `${count} Likes`;

    if (!user)
        if (buildEntryVersion) {
            return <div
                className="is-disabled"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#ddd", borderBottomLeftRadius: "12px" }}
            >
                <LikeOutline text={text} size={iconSize} />
            </div>
        } else {
            return <button className={liked ? "toggle-button-active" : "toggle-button"} disabled={true} title="Login required">
                <LikeOutline text={text} size={iconSize} />
            </button>
        }

    if (liked === undefined || liked === null) return null;

    const handleClick = async () => {
        setLoading(true);
        await toggleLike(buildId);
        setLoading(false);

        if (liked) setCount(p => p - 1);
        else setCount(p => p + 1);
    };

    if (buildEntryVersion) {
        return <div
            className={loading ? "is-disabled" : null}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#ddd", borderBottomLeftRadius: "12px" }}
            onClick={loading ? null : handleClick}
        >
            {liked ? <LikeSolid text={text} size={iconSize} /> : <LikeOutline text={text} size={iconSize} />}
        </div>
    } else {
        return <button onClick={handleClick} className={liked ? "toggle-button-active" : "toggle-button"} disabled={loading}>
            {liked ? <LikeSolid text={text} size={iconSize} /> : <LikeOutline text={text} size={iconSize} />}
        </button>
    }
}
