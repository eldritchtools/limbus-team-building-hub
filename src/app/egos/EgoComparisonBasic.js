import { EgoImg, Icon, RarityImg, useData } from "@eldritchtools/limbus-shared-library";
import { useState } from "react";
import { ColorResist, sinnerMapping } from "../utils";
import SkillCard from "../components/SkillCard";
import PassiveCard from "../components/PassiveCard";
import { EgoSelector } from "../components/Selectors";
import { selectStyleVariable } from "../styles";

const affinities = ["wrath", "lust", "sloth", "gluttony", "gloom", "pride", "envy"];

function ComparisonCard({ ego }) {
    const [skillData, skillDataLoading] = useData(`egos/${ego.id}`);
    if (skillDataLoading)
        return <div style={{ display: "flex", flexDirection: "column", flex: "1", minWidth: "320px", border: "1px #aaa solid", borderRadius: "1rem", padding: "0.5rem", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.2rem", textAlign: "center" }}>Loading...</span>
        </div>

    const skills = [];
    skillData.awakeningSkills.forEach(s => {
        skills.push(<SkillCard key={skills.length} skill={s} mini={true} type={"Awakening"} />)
    })

    if ("corrosionSkills" in skillData) {
        skillData.corrosionSkills.forEach(s => {
            skills.push(<SkillCard key={skills.length} skill={s} mini={true} type={"Corrosion"} />)
        })
    }

    skillData.passiveList.forEach(p => {
        skills.push(<PassiveCard key={skills.length} passive={p} mini={true} type={"Passive"} />)
    });

    return <div style={{ display: "flex", flexDirection: "column", flex: "1", minWidth: "320px", border: "1px #aaa solid", borderRadius: "1rem", padding: "0.5rem", gap: "0.5rem" }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "0.5rem", width: "100%" }}>
            <RarityImg rarity={ego.rank.toLowerCase()} style={{ display: "inline", height: "2rem" }} />
            <div style={{ display: "flex", flexDirection: "column", fontSize: "1.2rem", fontWeight: "bold", alignItems: "center", textAlign: "center" }}>
                <span>{sinnerMapping[ego.sinnerId]}</span>
                <span>{ego.name}</span>
            </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
            <EgoImg ego={ego} type={"awaken"} displayName={false} displayRarity={false} size={128} />
            {"corrosionType" in ego ? <EgoImg ego={ego} type={"erosion"} displayName={false} displayRarity={false} size={128} /> : null}
        </div>
        <div style={{ border: "1px #aaa solid", width: "100%" }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, max-content)", gap: "0.2rem", justifyItems: "center", alignSelf: "center" }}>
            {affinities.map(affinity => <Icon key={affinity} path={affinity} style={{ height: "32px", width: "32px" }} />)}
            {affinities.map(affinity => <span key={`${affinity}-c`}>{affinity in ego.cost ? `x${ego.cost[affinity]}` : <span style={{ color: "#777" }}>x0</span>}</span>)}
            {affinities.map(affinity => <span key={`${affinity}-r`}>{<ColorResist resist={ego.resists[affinity]} />}</span>)}
        </div>
        <div style={{ border: "1px #aaa solid", width: "100%" }} />
        <div style={{ display: "flex", flexDirection: "column", "gap": "0.2rem", width: "100%" }}>
            {skills}
        </div>
    </div>
}

export default function EgoComparisonBasic({ }) {
    const [selected, setSelected] = useState([]);
    const [egos, egosLoading] = useData(`egos`);

    if (egosLoading)
        return <div style={{ display: "flex", flexDirection: "column" }}>
            <h2>Loading data...</h2>
        </div>;

    return <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.9rem", wordWrap: "wrap" }}>
            Select two or more E.G.Os to compare their stats and skills.
        </span>
        <div style={{ minWidth: "20rem", maxWidth: "min(100rem, 90%)" }}>
            <EgoSelector selected={selected} setSelected={setSelected} isMulti={true} styles={selectStyleVariable} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {selected.map(id =>
                <ComparisonCard key={id} ego={egos[id]} />
            )}
        </div>
    </div>

}
