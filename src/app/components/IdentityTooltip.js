import { IdentityImg, KeywordIcon, useData } from "@eldritchtools/limbus-shared-library";
import { Tooltip } from "react-tooltip";
import { tooltipStyle } from "../styles";

function TooltipContent({ id }) {
    const [identities, identitiesLoading] = useData("identities_mini");
    if (!id || identitiesLoading) return null;

    const identity = identities[id];

    return <div style={tooltipStyle}>
        <div style={{ display: "flex", flexDirection: "row", padding: "0.5rem", gap: "0.5rem" }}>
            <IdentityImg identity={identity} uptie={4} displayName={false} scale={0.5} />
            <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ flex: 1 }}>{identity.name}</div>
                <div style={{ flex: 1, display: "flex" }}>
                    {identity.skillKeywordList.map(x => <KeywordIcon key={x} id={x} />)}
                </div>
                <div style={{ flex: 1, display: "flex" }}>
                    {identity.affinities.map(x => <KeywordIcon key={x} id={x} />)}
                </div>
                <div style={{ flex: 1, display: "flex" }}>
                    {identity.types.map(x => <KeywordIcon key={x} id={x} />)}
                </div>
            </div>
        </div>
    </div>
}

export function IdentityTooltip() {
    return <Tooltip
        id="identity-tooltip"
        render={({ content }) => <TooltipContent id={content} />}
        getTooltipContainer={() => document.body}
        style={{ backgroundColor: "transparent", zIndex: "9999" }}
    />
}