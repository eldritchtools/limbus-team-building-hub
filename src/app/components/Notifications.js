"use client";

import { useRouter } from "next/navigation";
import { setNotificationRead } from "../database/notifications";
import { getTimeAgo } from "../utils";

function constructActorStr(actors) {
    if (actors.length >= 4) return `${actors[0]}, ${actors[1]}, and ${actors.length - 2} more users`;
    if (actors.length === 3) return `${actors[0]}, ${actors[1]}, and 1 more user`;
    if (actors.length === 2) return `${actors[0]} and ${actors[1]}`
    return `${actors[0]}`;
}

function constructNotifMessage(notif) {
    const actorsStr = constructActorStr(notif.actors);

    return type === "comment" ?
        `${actorsStr} commented on your build ${build_title}` :
        `${actorsStr} replied to your comment to the build ${build_title}`;
}

export default function Notification({ notif }) {
    const router = useRouter();

    const handleNotifClick = async (notif) => {
        await setNotificationRead(notif.id);
        router.push(`/builds/${notif.build_id}`);
    }

    return <div onClick={() => handleNotifClick(notif)}
        style={{ marginBottom: "10px", padding: "8px", borderRadius: "4px", background: notif.is_read ? "transparent" : "#333", cursor: "pointer" }}>
        <div style={{ fontSize: "1rem", marginBottom: "4px" }} onClick={() => handleNotifClick(notif)}>
            {constructNotifMessage(notif)}
        </div>
        <div style={{ fontSize: "0.8rem", color: "#999" }}>
            {getTimeAgo(notif.created_at)}
        </div>
    </div>
}