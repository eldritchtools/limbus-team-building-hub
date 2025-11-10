import { replaceStatusVariables } from "@eldritchtools/limbus-shared-library";
import { useEffect, useState } from "react";

const romanMapping = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X" };

const sinnerMapping = {
    1: "Yi Sang",
    2: "Faust",
    3: "Don Quixote",
    4: "Ryōshū",
    5: "Meursault",
    6: "Hong Lu",
    7: "Heathcliff",
    8: "Ishmael",
    9: "Rodion",
    10: "Sinclair",
    11: "Outis",
    12: "Gregor"
}

const seasonMapping = {
    0: "Standard Fare",
    1: "1 - Orientation",
    2: "2 - Reminiscence",
    3: "3 - Bon Voyage",
    4: "4 - Clear All Cathy",
    5: "5 - Oblivion",
    6: "6 - Zàng Huā Yín"
}

const affinityColorMapping = {
    "wrath": "#fe0000",
    "lust": "#fb6500",
    "sloth": "#f7c729",
    "gluttony": "#9dfe00",
    "gloom": "#0dc1eb",
    "pride": "#1a64f0",
    "envy": "#9300db",
    "none": "#aaa"
}

function getSeasonString(season) {
    if (season > 9100) return `Walpurgisnacht ${season - 9100}`;
    else return seasonMapping[season];
}

function capitalizeFirstLetter(str) {
    if (typeof str !== 'string' || str.length === 0) {
        return str; // Handle empty strings or non-string inputs
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function ProcessedText({ text }) {
    let str = text.replaceAll("<style=\"highlight\">", "").replaceAll("</style>", "");

    return replaceStatusVariables(str);
}

function ColorResist({ resist }) {
    if (resist < 1) {
        return <span style={{ color: "#888", fontWeight: "bold" }}>x{resist}</span>
    } else if (resist > 1) {
        return <span style={{ color: "#fe0000", fontWeight: "bold" }}>x{resist}</span>
    } else {
        return <span style={{ color: "#c8aa80", fontWeight: "bold" }}>x{resist}</span>
    }
}

function getTimeAgo(timestamp) {
    if (!timestamp) return "";

    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.max(Math.floor((now - then) / 1000), 0);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
}

function useTimeAgo(timestamp, refreshMs = 60000) {
    const [timeAgo, setTimeAgo] = useState(() => getTimeAgo(timestamp));

    useEffect(() => {
        if (!timestamp) return;
        setTimeAgo(getTimeAgo(timestamp));

        // const interval = setInterval(() => {
        //     setTimeAgo(getTimeAgo(timestamp));
        // }, refreshMs);

        // return () => clearInterval(interval);
    }, [timestamp, refreshMs]);

    return timeAgo;
}


export { romanMapping, sinnerMapping, affinityColorMapping, getSeasonString, capitalizeFirstLetter, ProcessedText, ColorResist, useTimeAgo };