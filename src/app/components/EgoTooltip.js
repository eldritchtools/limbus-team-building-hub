"use client";

import { EgoImg, Icon, KeywordIcon, Status, useData } from "@eldritchtools/limbus-shared-library";
import { Tooltip } from "react-tooltip";
import { tooltipStyle } from "../styles";

function EgoTooltipContent({ ego }) {
    const types = [];

    types.push(ego.awakeningType.affinity);
    if (ego.corrosionType && ego.awakeningType.affinity !== ego.corrosionType.affinity)
        types.push(ego.corrosionType.affinity);

    types.push(ego.awakeningType.type);
    if (ego.corrosionType && ego.awakeningType.type !== ego.corrosionType.type)
        types.push(ego.corrosionType.type);

    return <div style={tooltipStyle}>
        <div style={{ display: "flex", flexDirection: "row", padding: "0.5rem", gap: "0.5rem", alignItems: "center" }}>
            <div><EgoImg ego={ego} type={"awaken"} displayName={false} style={{ width: "128px", height: "128px" }} /></div>
            <div style={{ display: "flex", flexDirection: "column", width: "192px", minHeight: "128px" }}>
                <div style={{ flex: 1, wordWrap: "normal", textAlign: "center" }}>{ego.name}</div>
                <div style={{ flex: 1, display: "flex" }}>
                    {types.map(x => <KeywordIcon key={x} id={x} />)}
                </div>
                <div style={{ flex: 1, display: "flex", flexWrap: "wrap" }}>
                    {ego.keywordTags.sort().map(x => <Status key={x} id={x} includeTooltip={false} includeName={false} />)}
                </div>
                <div style={{ flex: 1, display: "flex", flexWrap: "wrap" }}>
                    {Object.entries(ego.cost).map(([affinity, cost]) => <div key={affinity} style={{ display: "flex", alignItems: "center" }}>
                        <Icon path={affinity} style={{ height: "32px", width: "32px" }} />
                        <span>x{cost}</span>
                    </div>)}
                </div>
            </div>
        </div>
    </div>
}

function TooltipLoader({ id }) {
    const [egos, egosLoading] = useData("egos");
    if (!id || egosLoading) return null;

    return <EgoTooltipContent ego={egos[id]} />
}

function EgoTooltip() {
    return <Tooltip
        id="ego-tooltip"
        render={({ content }) => <TooltipLoader id={content} />}
        getTooltipContainer={() => document.body}
        style={{ backgroundColor: "transparent", zIndex: "9999" }}
    />
}

export { EgoTooltip, EgoTooltipContent };