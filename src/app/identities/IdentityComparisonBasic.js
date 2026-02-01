import { Icon, IdentityImg, KeywordIcon, RarityImg, useData } from "@eldritchtools/limbus-shared-library";
import { useState } from "react";
import { ColorResist, LEVEL_CAP, sinnerMapping } from "../utils";
import SkillCard from "../components/SkillCard";
import PassiveCard from "../components/PassiveCard";
import { constructHp, constructPassive } from "./IdentityUtils";
import { IdentitySelector } from "../components/Selectors";
import { selectStyleVariable } from "../styles";
import UptieSelector from "../components/UptieSelector";

function ComparisonCard({ identity }) {
    const [skillData, skillDataLoading] = useData(`identities/${identity.id}`);
    const [uptie, setUptie] = useState(4);

    if (skillDataLoading)
        return <div style={{ display: "flex", flexDirection: "column", flex: "1", minWidth: "320px", border: "1px #aaa solid", borderRadius: "1rem", padding: "0.5rem", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.2rem", textAlign: "center" }}>Loading...</span>
        </div>

    const skills = [];
    const counts = {};
    identity.skillTypes.forEach(s => {
        const data = skillData.skills[s.id];
        if (data.tier in counts) {
            skills.push(<SkillCard key={skills.length}  skill={data} uptie={uptie} mini={true} index={counts[data.tier]} />)
            counts[data.tier] += 1;
        } else {
            skills.push(<SkillCard key={skills.length} skill={data} uptie={uptie} mini={true} />)
            counts[data.tier] = 1;
        }
    })

    identity.defenseSkillTypes.forEach(s => {
        const data = skillData.skills[s.id];
        skills.push(<SkillCard key={skills.length} skill={data} uptie={uptie} mini={true} type={"defense"} />)
    })

    const combatPassives = skillData.combatPassives.findLast(passives => passives.uptie <= uptie) ?? {passives: []};
    combatPassives.passives.forEach(passive => {
        skills.push(<PassiveCard key={skills.length} passive={constructPassive(passive, skillData.passiveData)} mini={true} type={"Combat"} />)
    });

    const supportPassives = skillData.supportPassives.findLast(passives => passives.uptie <= uptie) ?? {passives: []};
    supportPassives.passives.forEach(passive => {
        skills.push(<PassiveCard key={skills.length} passive={constructPassive(passive, skillData.passiveData)} mini={true} type={"Support"} />)
    });

    return <div style={{ display: "flex", flexDirection: "column", flex: "1", minWidth: "320px", border: "1px #aaa solid", borderRadius: "1rem", padding: "0.5rem", gap: "0.5rem" }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <RarityImg rarity={identity.rank} style={{ display: "inline", height: "1.5rem" }} />
            <div style={{ display: "flex", flexDirection: "column", fontSize: "1rem", fontWeight: "bold", alignItems: "center", textAlign: "center" }}>
                <span>{sinnerMapping[identity.sinnerId]}</span>
                <span>{identity.name}</span>
            </div>
            <UptieSelector value={uptie} setValue={setUptie} />
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
            <IdentityImg identity={identity} uptie={2} displayName={false} displayRarity={false} size={128} />
            {identity.tags.includes("Base Identity") ? null : <IdentityImg identity={identity} uptie={4} displayName={false} displayRarity={false} size={128} />}
        </div>
        <div style={{ border: "1px #aaa solid", width: "100%" }} />
        <div style={{ display: "flex", flexDirection: "column", width: "auto", height: "auto", justifyContent: "center", gap: "0.2rem", alignItems: "center" }}>
            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr 2fr" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem", textAlign: "center" }}>
                    <Icon path={"hp"} style={{ height: "32px" }} />
                    {constructHp(identity, LEVEL_CAP)}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem", textAlign: "center" }}>
                    <Icon path={"speed"} style={{ height: "32px" }} />
                    {identity.speedList[uptie-1].join(" - ")}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem", textAlign: "center" }}>
                    <Icon path={"defense level"} style={{ height: "32px" }} />
                    {LEVEL_CAP + identity.defCorrection} ({identity.defCorrection >= 0 ? `+${identity.defCorrection}` : identity.defCorrection})
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem" }}>
                    <Icon path={"Slash"} style={{ height: "32px" }} />
                    <ColorResist resist={identity.resists.slash} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem" }}>
                    <Icon path={"Pierce"} style={{ height: "32px" }} />
                    <ColorResist resist={identity.resists.pierce} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem" }}>
                    <Icon path={"Blunt"} style={{ height: "32px" }} />
                    <ColorResist resist={identity.resists.blunt} />
                </div>
            </div>

            <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                {(identity.skillKeywordList || []).map(x => <KeywordIcon key={x} id={x} />)}
            </div>
        </div>
        <div style={{ border: "1px #aaa solid", width: "100%" }} />
        <div style={{ display: "flex", flexDirection: "column", "gap": "0.2rem", width: "100%" }}>
            {skills}
        </div>
    </div>
}

export default function IdentityComparisonBasic({ }) {
    const [selected, setSelected] = useState([]);
    const [identities, identitiesLoading] = useData(`identities`);

    if (identitiesLoading)
        return <div style={{ display: "flex", flexDirection: "column" }}>
            <h2>Loading data...</h2>
        </div>;

    return <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.9rem", wordWrap: "wrap" }}>
            Select two or more identities to compare their stats and skills.
        </span>
        <div style={{ minWidth: "20rem", maxWidth: "min(100rem, 90%)" }}>
            <IdentitySelector selected={selected} setSelected={setSelected} isMulti={true} styles={selectStyleVariable} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {selected.map(id =>
                <ComparisonCard key={id} identity={identities[id]} />
            )}
        </div>
    </div>

}
