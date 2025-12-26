import { useEffect, useState } from "react";
import { useRequestsCache } from "../database/RequestsCacheProvider";
import { useAuth } from "../database/authProvider";

export default function LikeButton({ buildId, likeCount }) {
    const { user } = useAuth();
    const { likedMap, toggleLike, fetchUserData } = useRequestsCache();
    const [count, setCount] = useState(likeCount);
    const [loading, setLoading] = useState(false);

    useEffect(() => { if (user) fetchUserData([buildId]) }, [fetchUserData, buildId, user]);
    const liked = useMemo(() => likedMap[buildId], [likedMap, buildId]);

    if (!user)
        return <button className={liked ? "toggle-button-active" : "toggle-button"} disabled={true} title="Login required">
            👍 {count}
        </button>

    if (liked === undefined || liked === null) return null;

    const handleClick = async () => {
        setLoading(true);
        await toggleLike(buildId);
        setLoading(false);

        if (liked) setCount(p => p - 1);
        else setCount(p => p + 1);
    };

    return <button onClick={handleClick} className={liked ? "toggle-button-active" : "toggle-button"} disabled={loading}>
        👍 {count}
    </button>
}
