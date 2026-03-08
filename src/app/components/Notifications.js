"use client";

import { useRouter } from "next/navigation";
import { setNotificationRead } from "../database/notifications";
import "./Notifications.css";
import ReactTimeAgo from "react-time-ago";

function constructActorStr(actors) {
    if (actors.length >= 4) return `${actors[0]}, ${actors[1]}, and ${actors.length - 2} more users`;
    if (actors.length === 3) return `${actors[0]}, ${actors[1]}, and 1 more user`;
    if (actors.length === 2) return `${actors[0]} and ${actors[1]}`
    return `${actors[0]}`;
}

const targetTypeMapping = {
    "build": "build",
    "build_list": "curated list"
}

function constructNotifMessage(notif) {
    const actorsStr = constructActorStr(notif.actors);
    const type = targetTypeMapping[notif.target_type];

    return notif.type === "comment" ?
        `${actorsStr} commented on your ${type} ${notif.title}` :
        `${actorsStr} replied to your comment to the ${type} ${notif.title}`;
}

export default function Notification({ notif, updateNotif }) {
    const router = useRouter();

    const handleNotifClick = async (notif) => {
        await setNotificationRead(notif.id);
        if (updateNotif && !notif.is_read) updateNotif({ ...notif, is_read: true });
        switch(notif.target_type) {
            case "build":
                router.push(`/builds/${notif.target_id}`);
                return;
            case "build_list":
                router.push(`/curated-lists/${notif.target_id}`);
                return;
            default:
                return
        }
    }

    return <div onClick={() => handleNotifClick(notif)} className={notif.is_read ? "notif-read" : "notif"}>
        <div style={{ fontSize: "1rem", marginBottom: "4px" }} onClick={() => handleNotifClick(notif)}>
            {constructNotifMessage(notif)}
        </div>
        <div style={{ fontSize: "0.8rem", color: "#999" }}>
            <ReactTimeAgo date={notif.created_at} locale="en-US" timeStyle="mini" />
        </div>
    </div>
}