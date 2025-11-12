"use client";

import { EgoImg, KeywordIcon, Status, useData } from "@eldritchtools/limbus-shared-library";
import { Tooltip } from "react-tooltip";
import { tooltipStyle } from "../styles";

function TooltipContent({ id }) {
    const [egos, egosLoading] = useData("egos");
    if (!id || egosLoading) return null;

    const ego = egos[id];
    const types = [];

    types.push(ego.awakeningType.affinity);
    if(ego.corrosionType && ego.awakeningType.affinity !== ego.corrosionType.affinity)
        types.push(ego.corrosionType.affinity);

    types.push(ego.awakeningType.type);
    if(ego.corrosionType && ego.awakeningType.type !== ego.corrosionType.type)
        types.push(ego.corrosionType.type);

    return <div style={tooltipStyle}>
        <div style={{ display: "flex", flexDirection: "row", padding: "0.5rem", gap: "0.5rem" }}>
            <EgoImg ego={ego} type={"awaken"} displayName={false} scale={0.5} />
            <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ flex: 1 }}>{ego.name}</div>
                <div style={{ flex: 1, display: "flex" }}>
                    {types.map(x => <KeywordIcon key={x} id={x} />)}
                </div>
                <div style={{ flex: 1, display: "flex", flexWrap: "wrap" }}>
                    {ego.keywordTags.sort().map(x => <Status key={x} id={x} includeTooltip={false} includeName={false} />)}
                </div>
            </div>
        </div>
    </div>
}

export function EgoTooltip() {
    return <Tooltip
        id="ego-tooltip"
        render={({ content }) => <TooltipContent id={content} />}
        getTooltipContainer={() => document.body}
        style={{ backgroundColor: "transparent", zIndex: "9999" }}
    />
}