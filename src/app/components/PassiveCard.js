import { Icon } from "@eldritchtools/limbus-shared-library";
import { ProcessedText } from "../utils";

function PassiveCost({ condition, iconSize }) {
    const costs = condition.requirement.map((cost, i) => {
        return [<Icon key={`${i}-icon`} path={cost.type} style={{ width: iconSize }} />, <span key={`${i}-num`}> x{cost.value}</span>]
    }).flat();

    return <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        {costs}
        <span style={{ "paddingLeft": "0.2em" }}>{condition.type.toUpperCase()}</span>
    </div>
}

export default function PassiveCard({ passive, mini = false, type }) {
    let iconSize = mini ? "24px" : "32px";
    let iconStyleOverride = mini ? { width: "24px", height: "24px" } : {};
    let nameStyleOverride = mini ? { fontSize: "0.8rem" } : {};

    return <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        border: `1px #777 solid`, borderRadius: "0.5rem", textAlign: "start",
        padding: "0.5rem", boxSizing: "border-box", fontSize: mini ? "0.8rem" : "1rem"
    }}>
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", flexDirection: "row", gap: mini ? "0.1rem" : "0.25rem" }}>
                <div style={{ borderRadius: "5px", backgroundColor: "grey", padding: "5px", color: "#ddd", textShadow: "black 1px 1px 5px", fontWeight: "bold" }}>{passive.name}</div>
                {"condition" in passive ? <PassiveCost condition={passive.condition} iconSize={iconSize} /> : null}
            </div>
            {type ?
                <div style={{ flex: "0 0 auto", color: "#aaa", fontWeight: "bold", fontSize: mini ? "1rem" : "1.25rem", marginLeft: "0.5rem" }}>
                    {type}
                </div> : null
            }
        </div>
        <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.2" }}>
            <ProcessedText text={passive.desc} iconStyleOverride={iconStyleOverride} nameStyleOverride={nameStyleOverride} />
        </div>
    </div>;
}
