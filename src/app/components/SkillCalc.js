import { affinityColorMapping, Icon, useData, useDataMultiple } from "@eldritchtools/limbus-shared-library";
import { capitalizeFirstLetter, LEVEL_CAP } from "../utils";
import AutoScroller from "./AutoScroller";
import { useMemo } from "react";

const formatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

function computeSkill(skill, opts) {
    if ((opts.cond === "skill" || opts.cond === "all") && !skill.bonusesEnabled)
        return ["--", "--"];

    let basePower = skill.basePower;
    let coinPowerBonus = 0;
    let damageMultiplier = 1;
    let critMultiplier = 0; // Added to damage multiplier, so no need to start at 1
    let damageAdder = 0;
    let clashBonus = 0;
    let offDefLevel = skill.offDefLevel;

    if (skill.bonusesEnabled && opts.cond !== "default")
        skill.bonuses?.forEach(bonus => {
            switch (bonus.type) {
                case "base": case "final":
                    basePower += bonus.value;
                    break;
                case "clash":
                    clashBonus += bonus.value;
                    break;
                case "coin":
                    coinPowerBonus += bonus.value;
                    break;
                case "damage":
                    if (bonus.extra.op === "mul")
                        damageMultiplier += bonus.value;
                    else if (bonus.extra.op === "add")
                        damageAdder += bonus.value;
                    break;
                case "critdamage":
                    critMultiplier += bonus.value;
                    break;
                case "skilllevel":
                    offDefLevel += bonus.value;
                    break;
                default:
                    break;
            }
        })


    let [clash, damage] = skill.coins.reduce(([clash, damage, roll], coin) => {
        let coinPower = skill.coinPower + coinPowerBonus;
        let coinDamageMultiplier = damageMultiplier;
        let coinCritMultiplier = critMultiplier;
        let coinDamageAdder = 0;
        let coinReuses = 0;
        let critReuses = 0;
        let headReuses = 0;
        let endBonuses = [];

        if (skill.bonusesEnabled && opts.cond === "all")
            coin.bonuses?.forEach(bonus => {
                switch (bonus.type) {
                    case "coin":
                        coinPower += bonus.value;
                        break;
                    case "damage":
                        if (bonus.extra.op === "mul")
                            if ("type" in bonus.extra.op) {
                                endBonuses.push(bonus);
                            } else {
                                coinDamageMultiplier += bonus.value;
                            }
                        else if (bonus.extra.op === "add") {
                            if ("type" in bonus.extra.op)
                                coinDamageAdder += bonus.value * opts.target[bonus.extra.op["type"]];
                            else
                                coinDamageAdder += bonus.value;
                        }
                        break;
                    case "critdamage":
                        coinCritMultiplier += bonus.value;
                        break;
                    case "reuse":
                        if (bonus.extra?.cond === "crit")
                            critReuses += bonus.value;
                        else if (bonus.extra?.cond === "heads")
                            headReuses += bonus.value;
                        else
                            coinReuses += bonus.value;
                        break;
                    default:
                        break;
                }
            })

        let p = 0;
        if (opts.type === "max") p = coinPower < 0 ? 0 : 1;
        else if (opts.type === "min") p = coinPower < 0 ? 1 : 0;
        else if (opts.type === "avg") p = 0.5 + (opts.sp / 100);

        let resistMultiplier = 1;
        if (skill.atkType) resistMultiplier += (opts.target[skill.atkType] ?? 1) - 1;
        if (skill.affinity !== "none") resistMultiplier += (opts.target[skill.affinity] ?? 1) - 1;
        resistMultiplier += (offDefLevel - (opts.target.def ?? LEVEL_CAP)) / (Math.abs(offDefLevel - (opts.target.def ?? LEVEL_CAP)) + 25);

        let newRoll = roll;
        let newDamage = 0;
        for (let i = 0; i < 1 + coinReuses + (skill.applyCrits ? critReuses : 0); i++) {
            newRoll += (p * coinPower);
            if (skill.applyCrits) {
                newDamage += newRoll * (resistMultiplier + 0.2) * (coinDamageMultiplier + coinCritMultiplier) + coinDamageAdder;
            } else {
                newDamage += newRoll * resistMultiplier * coinDamageMultiplier + coinDamageAdder;
            }
        }
        let reuseMultiplier = 1;
        for (let i = 0; i < headReuses; i++) {
            reuseMultiplier *= p;
            newRoll += (p * coinPower);
            if (skill.applyCrits) {
                newDamage += reuseMultiplier * (newRoll * (resistMultiplier + 0.2) * (coinDamageMultiplier + coinCritMultiplier) + coinDamageAdder);
            } else {
                newDamage += reuseMultiplier * (newRoll * resistMultiplier * coinDamageMultiplier + coinDamageAdder);
            }
        }

        if (newDamage < 1) newDamage = 1;

        let finalDamage = newDamage;
        endBonuses.forEach(bonus => {
            if (bonus.type === "damage" && bonus.extra.op === "mul") {
                let addedDamage = newDamage * bonus.value;
                if ("max" in bonus.extra.op) addedDamage = Math.min(addedDamage, bonus.extra.op["max"]);
                finalDamage += addedDamage * opts.target[bonus.extra.op["type"]];
            }
        });

        return [clash + (p * coinPower), damage + finalDamage, newRoll];
    }, [basePower, 0, basePower]);

    if (skill.atkType) {
        if (offDefLevel > (opts.target.off ?? LEVEL_CAP)) clash += Math.floor((offDefLevel - (opts.target.off ?? LEVEL_CAP)) / 3);
    } else {
        if (offDefLevel > (opts.target.def ?? LEVEL_CAP)) clash += Math.floor((offDefLevel - (opts.target.def ?? LEVEL_CAP)) / 3);
    }

    clash += clashBonus;

    return [formatter.format(clash), skill.atkType ? formatter.format(damage) : "0"];
}

function CalcCard({ skill, clash, damage }) {
    return <div style={{ display: "flex", flexDirection: "column", border: `1px ${affinityColorMapping[skill.affinity] ?? "#777"} solid`, borderRadius: "1rem", padding: "0.5rem", gap: "0.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "0.2rem", alignItems: "center" }}>
                {skill.atkType ?
                    <Icon path={capitalizeFirstLetter(skill.atkType)} style={{ width: "24px" }} /> :
                    <Icon path={capitalizeFirstLetter(skill.defType)} style={{ width: "24px" }} />
                }
                <div style={{
                    borderRadius: "5px", backgroundColor: affinityColorMapping[skill.affinity], padding: "5px",
                    color: "#ddd", textShadow: "black 1px 1px 5px", fontWeight: "bold", fontSize: "0.8rem"
                }}>
                    {skill.name}
                </div>
            </div>
            <div style={{ flex: "0 0 auto", color: "#aaa", fontWeight: "bold", fontSize: "1rem", marginLeft: "0.5rem" }}>
                {typeof skill.rank[0] === 'number' ? `Skill ${skill.rank[0]}` : skill.rank[0]}{skill.rank.length === 2 ? `-${skill.rank[1]}` : ""}
            </div>
        </div>
        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "0.25rem", alignItems: "center", marginBottom: "0.25rem" }}>
            <span style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                <span>
                    Power: {skill.basePower} {skill.coinPower < 0 ? skill.coinPower : `+${skill.coinPower}`}
                </span>
                <span style={{ gap: "0" }}>
                    {skill.coins.map((coin, i) => <Icon key={i} path={coin === "unbreakable" ? "unbreakable coin" : "coin"} style={{ height: "18px" }} />)}
                </span>
            </span>
            <span style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                {skill.defType === "attack" || skill.defType === "counter" ?
                    <Icon path={"offense level"} style={{ width: "24px" }} /> :
                    <Icon path={"defense level"} style={{ width: "24px" }} />
                }
                <span>{skill.offDefLevel}</span>
            </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr" }}>
            <span>Clash: {formatter.format(clash)}</span>
            {skill.atkType ?
                <span>Damage: {formatter.format(damage)}</span> :
                null
            }
        </div>
    </div>
}

function SkillCalc({ skills, opts }) {
    if (opts.view === "expand") {
        return <AutoScroller>
            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "0.1rem" }}>
                {skills.map((skill, i) => {
                    const [clash, damage] = computeSkill(skill, opts);
                    return <CalcCard key={i} skill={skill} clash={clash} damage={damage} />
                })}
            </div>
        </AutoScroller>;
    }

    if (opts.view === "compress") {
        const clashes = {};
        const damages = {};

        skills.forEach(skill => {
            const [clash, damage] = computeSkill(skill, opts);
            const label = typeof skill.rank[0] === 'number' ? `S${skill.rank[0]}` : (skill.rank[0] === "Defense" ? "Def" : skill.rank[0][0]);

            if (!(label in clashes)) clashes[label] = [];
            if (clashes[label].length !== 0) clashes[label].push(<span key={clashes[label].length}>, </span>);
            clashes[label].push(<span key={clashes[label].length} style={{ color: affinityColorMapping[skill.affinity] ?? "#ddd", fontWeight: "bold" }}>{clash}</span>)

            if (!(label in damages)) damages[label] = [];
            if (damages[label].length !== 0) damages[label].push(<span key={damages[label].length}>, </span>);
            damages[label].push(<span key={damages[label].length} style={{ color: affinityColorMapping[skill.affinity] ?? "#ddd", fontWeight: "bold" }}>{damage}</span>)
        });

        const gridItems = [
            <div key={-1} />,
            <div key={"c"} style={{ textAlign: "center" }}>Clash</div>,
            <div key={"d"} style={{ textAlign: "center" }}>Damage</div>
        ]

        Object.keys(clashes).forEach((key, i) => {
            gridItems.push(<div key={i} style={{ textAlign: "center", padding: "0rem 0.25rem", fontWeight: "bold", color: "#aaa" }}>{key}</div>);
            gridItems.push(<div key={`${i}-c`} style={{ borderLeft: "1px #777 solid", padding: "0rem 0.2rem" }}>
                {clashes[key]}
            </div>);
            gridItems.push(<div key={`${i}-d`} style={{ borderLeft: "1px #777 solid", padding: "0rem 0.2rem" }}>
                {damages[key]}
            </div>);
        })

        return <AutoScroller>
            <div style={{ display: "grid", gridTemplateColumns: "auto 2fr 3fr", width: "100%", gap: "0.2rem" }}>
                {gridItems}
            </div>
        </AutoScroller>;
    }

    return null;
}

function extractSkillData(skill, uptie, level, rank, applyCrits = false) {
    const data = skill.data.reduce((acc, dataTier) => dataTier.uptie <= uptie ? { ...acc, ...dataTier } : acc, {});

    return {
        name: data.name,
        rank: rank,
        atkType: data.atkType,
        defType: data.defType,
        affinity: data.affinity,
        coins: data.coins,
        basePower: data.baseValue,
        coinPower: data.coinValue,
        offDefLevel: data.levelCorrection + level,
        bonusesEnabled: skill.bonusesEnabled,
        bonuses: data.bonuses,
        applyCrits: applyCrits
    };
}

function IdentitySkillCalc({ identity, uptie = 4, level = LEVEL_CAP, opts }) {
    const [skillData, skillDataLoading] = useData(`identities/${identity.id}`);

    if (skillDataLoading)
        return <div style={{ display: "flex", width: "100%", height: "100%", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            Loading...
        </div>;

    const applyCrits = opts.crit === "all" || (opts.crit === "poise" && identity.skillKeywordList.includes("Poise"))

    const [atkskills] = identity.skillTypes.reduce(([skills, counts], skill) => {
        const tier = skillData.skills[skill.id].tier;

        if (tier in counts) {
            return [
                [...skills, extractSkillData(skillData.skills[skill.id], uptie, level, [tier, counts[tier] + 1], applyCrits)],
                { ...counts, [tier]: counts[tier] + 1 }
            ]
        } else {
            return [
                [...skills, extractSkillData(skillData.skills[skill.id], uptie, level, [tier], applyCrits)],
                { ...counts, [tier]: 1 }
            ]
        }
    }, [[], {}]);

    const defskills = identity.defenseSkillTypes.map(s => extractSkillData(skillData.skills[s.id], uptie, level, ["Defense"], applyCrits));

    const list = [...atkskills, ...defskills];

    if (list.length === 0) return null;

    return <SkillCalc skills={list} opts={opts} />
}

const egoRanks = ["ZAYIN", "TETH", "HE", "WAW", "ALEPH"];

function EgoSkillCalc({ egos, threadspins, level = LEVEL_CAP, opts }) {
    const egosList = useMemo(() => egos.map((ego, i) => [ego, threadspins ? (threadspins[i] ?? 4) : 4, egoRanks[i]]), [egos, threadspins]);

    const [skillData, skillDataLoading] = useDataMultiple(egosList.filter(([ego]) => ego).map(([ego]) => `egos/${ego.id}`));

    if (skillDataLoading) return null;

    const list = egosList
        .filter(([ego]) => ego)
        .map(([ego, ts, rank]) => {
            const data = skillData[`egos/${ego.id}`];
            const skillList = [...data.awakeningSkills, ...(data.corrosionSkills ?? [])];

            return skillList.map(skill => extractSkillData(skill, ts, level, [rank]));
        }).flat();

    if (list.length === 0) return null;

    return <SkillCalc skills={list} opts={opts} />
}

export { IdentitySkillCalc, EgoSkillCalc };
