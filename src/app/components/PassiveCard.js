import { Icon } from "@eldritchtools/limbus-shared-library";
import { ProcessedText } from "../utils";

function PassiveCost({ condition }) {
    const costs = condition.requirement.map((cost, i) => { return [<Icon key={`${i}-icon`} path={cost.type} style={{ height: "2rem" }} />, <span key={`${i}-num`}> x{cost.value}</span>] }).flat();
    return <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}> {costs} <span style={{ "paddingLeft": "0.2em" }}>{condition.type.toUpperCase()}</span></div>
}

export default function PassiveCard({ passive }) {
    return <div style={{ width: "100%", minWidth: "480px", height: "100%", display: "flex", flexDirection: "column", border: `1px #777 solid`, borderRadius: "0.5rem", textAlign: "start", padding: "0.5rem", boxSizing: "border-box" }}>
        <div style={{ display: "flex", flexDirection: "row", marginBottom: "0.5rem" }}>
            <div style={{ borderRadius: "5px", backgroundColor: "grey", padding: "5px", color: "#ddd", textShadow: "black 1px 1px 5px", fontWeight: "bold" }}>{passive.name}</div>
            {"condition" in passive ? <PassiveCost condition={passive.condition} /> : null}
        </div>
        <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.2" }}>
            <ProcessedText text={passive.desc} />
        </div>
    </div>;
}
