import { affinityColorMapping, Icon } from "@eldritchtools/limbus-shared-library";
import { capitalizeFirstLetter, ProcessedText, romanMapping } from "../utils";

function Coin({ num }) {
    return <div style={{ position: "relative", height: "1.5rem", width: "1.5rem", verticalAlign: "center" }}>
        <Icon path={"Coin Outline"} style={{ height: "1.5rem", width: "1.5rem" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "1rem" }}> {romanMapping[num]} </div>
    </div>
}

function SkillLabel({ skill, type, index }) {
    switch (type) {
        case "attack":
            if (index === 0) return `Skill ${skill.tier}`;
            else return `Skill ${skill.tier}-${index + 1}`;
        case "defense":
            return "Defense";
        case "awakening":
            return "Awakening";
        case "corrosion":
            return "Corrosion";
        default:
            return type;
    }
}

export default function SkillCard({ skill, uptie, count = 0, level, type = "attack", index = 0, mini = false }) {
    let skillData = skill.data.reduce((acc, dataTier) => dataTier.uptie <= uptie ? { ...acc, ...dataTier } : acc, {});
    let skillText = skill.text.reduce((acc, textTier) => textTier.uptie <= uptie ? { ...acc, ...textTier } : acc, {});

    if (Object.keys(skillData).length === 0 || Object.keys(skillText).length === 0) return null;

    let iconSize = mini ? "24px" : "32px";
    let coinSize = mini ? "18px" : "24px";
    let iconStyleOverride = mini ? { width: "24px", height: "24px" } : {};
    let nameStyleOverride = mini ? { fontSize: "0.8rem" } : {};

    return <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        border: `1px ${affinityColorMapping[skillData.affinity]} solid`, borderRadius: "0.5rem",
        padding: "0.5rem", boxSizing: "border-box", fontSize: mini ? "0.8rem" : "1rem"
    }}>
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginBottom: "0.25rem" }}>
            <div style={{ display: "flex", flexDirection: "row", gap: mini ? "0.1rem" : "0.25rem", alignItems: "center" }}>
                {skillData.affinity !== "none" ? <Icon path={skillData.affinity} style={{ width: iconSize }} /> : null}
                {skillData.defType !== "attack" ? <Icon path={capitalizeFirstLetter(skillData.defType)} style={{ width: iconSize }} /> : null}
                {skillData.defType === "attack" || skillData.defType === "counter" ? <Icon path={capitalizeFirstLetter(skillData.atkType)} style={{ width: iconSize }} /> : null}
                <div style={{ borderRadius: "5px", backgroundColor: affinityColorMapping[skillData.affinity], padding: "5px", color: "#ddd", textShadow: "black 1px 1px 5px", fontWeight: "bold" }}>
                    {skillText.name}
                </div>
                {count > 0 ? <div style={{ color: "#aaa", fontWeight: "bold", fontSize: mini ? "1rem" : "1.25rem" }}>x{count}</div> : null}
            </div>
            <div style={{ flex: "0 0 auto", color: "#aaa", fontWeight: "bold", fontSize: mini ? "1rem" : "1.25rem", marginLeft: "0.5rem" }}>
                <SkillLabel skill={skill} type={type} index={index} />
            </div>
        </div>
        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "0.25rem", alignItems: "center", marginBottom: "0.25rem" }}>
            <span style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                <span>
                    Power: {skillData.baseValue} {skillData.coinValue < 0 ? skillData.coinValue : `+${skillData.coinValue}`}
                </span>
                <span style={{ gap: "0" }}>
                    {skillData.coinTypes.map((coin, i) => <Icon key={i} path={coin === "unbreakable" ? "unbreakable coin" : "coin"} style={{ height: coinSize }} />)}
                </span>
            </span>
            <span style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                {skillData.defType === "attack" || skillData.defType === "counter" ?
                    <Icon path={"offense level"} style={{ width: iconSize }} /> :
                    <Icon path={"defense level"} style={{ width: iconSize }} />
                }
                {level ?
                    <span>{level + skillData.levelCorrection} ({skillData.levelCorrection < 0 ? skillData.levelCorrection : `+${skillData.levelCorrection}`})</span> :
                    skillData.levelCorrection < 0 ? skillData.levelCorrection : `+${skillData.levelCorrection}`
                }
                <span>
                    Atk Weight: {skillData.atkWeight}
                </span>
            </span>
        </div>
        <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.2", marginBottom: "0.25rem" }}>
            {skillText.desc ?
                <ProcessedText text={skillText.desc} iconStyleOverride={iconStyleOverride} nameStyleOverride={nameStyleOverride} /> :
                null
            }
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {skillText.coinDescs ? skillText.coinDescs.map((coinDescs, index) => coinDescs.length > 0 ?
                <div key={index} style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
                    <Coin num={index + 1} />
                    <div style={{ display: "flex", flex: 1, flexDirection: "column", whiteSpace: "pre-wrap", gap: "0.1rem" }}>
                        {coinDescs.map((desc, innerIndex) => <ProcessedText key={`${innerIndex}-text`} text={desc} iconStyleOverride={iconStyleOverride} nameStyleOverride={nameStyleOverride} />)}
                    </div>
                </div> : null
            ) : null}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, auto)", whiteSpace: "pre-wrap" }}>

        </div>
    </div>
}
