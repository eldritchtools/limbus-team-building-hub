import { replaceStatusVariables } from "@eldritchtools/limbus-shared-library";

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
    6: "6 - Zàng Huā Yín",
    8000: "Pilgrimage of Compassion"
}

const LEVEL_CAP = 55;

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

export { romanMapping, sinnerMapping, LEVEL_CAP, getSeasonString, capitalizeFirstLetter, ProcessedText, ColorResist };
