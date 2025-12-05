import { useEffect, useState } from "react";
import { useRequestsCache } from "../database/RequestsCacheProvider";
import { useAuth } from "../database/authProvider";

export default function LikeButton({ buildId, likeCount }) {
    const { user } = useAuth();
    const { likedMap, toggleLike, fetchUserData } = useRequestsCache();
    const [count, setCount] = useState(likeCount);

    useEffect(() => { if (user) fetchUserData([buildId]) }, [fetchUserData, buildId, user]);
    if (!user)
        return <button className={liked ? "toggle-button-active" : "toggle-button"} disabled={true}>
            👍 {count}
        </button>

    const liked = likedMap[buildId];

    if (liked === undefined || liked === null) return null;

    const handleClick = async () => {
        await toggleLike(buildId);

        if (liked) setCount(p => p - 1);
        else setCount(p => p + 1);
    };

    return <button onClick={handleClick} className={liked ? "toggle-button-active" : "toggle-button"}>
        👍 {count}
    </button>
}
