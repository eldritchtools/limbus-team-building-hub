import { useData, useDataMultiple } from "@eldritchtools/limbus-shared-library";
import { LEVEL_CAP } from "../utils";
import SkillCard from "./SkillCard";
import AutoScroller from "./AutoScroller";
import PassiveCard from "./PassiveCard";
import { constructPassive } from "../identities/IdentityUtils";
import { useMemo } from "react";

function IdentitySkillLoader({ identity, type, uptie = 4, level = LEVEL_CAP }) {
    const [skillData, skillDataLoading] = useData(`identities/${identity.id}`);

    if (skillDataLoading) return null;

    const getSkillList = (t) => {
        if (t === "s1") return identity.skillTypes.filter(skill => skill.type.tier === 1).map((s, i) => ["atk", s, i]);
        if (t === "s2") return identity.skillTypes.filter(skill => skill.type.tier === 2).map((s, i) => ["atk", s, i]);
        if (t === "s3") return identity.skillTypes.filter(skill => skill.type.tier === 3).map((s, i) => ["atk", s, i]);
        if (t === "def") return identity.defenseSkillTypes.map(s => ["def", s, -1]);
        if (t === "skills")
            return [
                ...getSkillList("s1"),
                ...getSkillList("s2"),
                ...getSkillList("s3"),
                ...getSkillList("def")
            ]
        if (t === "passives1") {
            const combatPassives = skillData.combatPassives.findLast(passives => passives.level <= uptie);
            return combatPassives ? combatPassives.passives.map(passive => ["pasa", passive, -1]) : [];
        }
        if (t === "passives2") {
            const supportPassives = skillData.supportPassives.findLast(passives => passives.level <= uptie);
            return supportPassives ? supportPassives.passives.map(passive => ["pasb", passive, -1]) : [];
        }

        return [];
    }

    const list = getSkillList(type);
    if (list.length === 0) return null;

    return <AutoScroller>
        <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "0.1rem" }}>
            {list.map(([type, skill, i], ind) => <div key={ind}>
                {type === "atk" ?
                    <SkillCard skill={skillData.skills[skill.id]} mini={true} uptie={uptie} count={skill.num} level={level} index={i} /> :
                    type === "def" ?
                        <SkillCard skill={skillData.skills[skill.id]} mini={true} uptie={uptie} count={skill.num} level={level} type={"defense"} /> :
                        type === "pasa" ?
                            <PassiveCard passive={constructPassive(skill, skillData.passiveData)} mini={true} /> :
                            <PassiveCard passive={skillData.passiveData[skill]} mini={true} />
                }
            </div>)}
        </div>
    </AutoScroller>
}

const egoRanks = ["ZAYIN", "TETH", "HE", "WAW", "ALEPH"];

function EgoSkillLoader({ egos, type, threadspins, num }) {
    const chosen = useMemo(() => (num !== undefined) ?
        ([[egos[num], threadspins && threadspins[num] ? threadspins[num] : 4]]) :
        egos.map((ego, i) => [ego, threadspins && threadspins[i] ? threadspins[i] : 4]),
        [egos, threadspins, num]);

    const [skillData, skillDataLoading] = useDataMultiple(chosen.filter(x => x[0]).map(([ego, _]) => `egos/${ego.id}`));

    if (skillDataLoading) return null;

    const getSkillList = (t) => {
        if (t === "ego") {
            const [ego, threadspin] = chosen[0];
            if (!ego) return [];
            const passives = skillData[`egos/${ego.id}`].passiveList;
            const list = [["awa", skillData[`egos/${ego.id}`].awakeningSkill, threadspin, null]];
            if ("corrosionSkill" in skillData[`egos/${ego.id}`])
                list.push(["cor", skillData[`egos/${ego.id}`].corrosionSkill, threadspin, null]);
            if (threadspin >= 2 && passives)
                passives.forEach(passive => list.push(["pas", passive, threadspin, "Passive"]));
            return list;
        }
        if (t === "egoa")
            return chosen
                .map(([x, t], i) => [x, t, egoRanks[i]])
                .filter(x => x[0])
                .map(([ego, threadspin, rank]) => ["awa", skillData[`egos/${ego.id}`].awakeningSkill, threadspin, rank]);
        if (t === "egob")
            return chosen
                .map(([x, t], i) => [x, t, egoRanks[i]])
                .filter(x => x[0] && "corrosionSkill" in skillData[`egos/${x[0].id}`])
                .map(([ego, threadspin, rank]) => ["cor", skillData[`egos/${ego.id}`].corrosionSkill, threadspin, rank]);
        if (t === "egopassives")
            return chosen
                .map(([x, t], i) => [x, t, egoRanks[i]])
                .filter(x => x[0] && x[1] >= 2)
                .map(([ego, threadspin, rank]) => skillData[`egos/${ego.id}`].passiveList.map(passive => ["pas", passive, threadspin, rank])).flat();
    }

    const list = getSkillList(type);
    if (list.length === 0) return null;

    return <AutoScroller>
        <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "0.1rem" }}>
            {list.map(([type, skill, threadspin, rank], ind) => <div key={ind}>
                {type === "awa" ?
                    <SkillCard skill={skill} mini={true} uptie={threadspin} type={rank ?? "awakening"} /> :
                    type === "cor" ?
                        <SkillCard skill={skill} mini={true} uptie={threadspin} type={rank ?? "corrosion"} /> :
                        <PassiveCard passive={skill} mini={true} type={rank} />
                }
            </div>)}
        </div>
    </AutoScroller>
}

export { IdentitySkillLoader, EgoSkillLoader };
