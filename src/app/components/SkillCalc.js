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
    let lastCoinBonuses = [];

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
                    if (bonus.extra.cond === "tolastcoin") {
                        lastCoinBonuses.push(bonus);
                    } else if (bonus.extra.op === "mul") {
                        damageMultiplier += bonus.value;
                    } else if (bonus.extra.op === "add") {
                        damageAdder += bonus.value;
                    }
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

    const evaluateValue = value => {
        if (typeof value === 'number')
            return value;

        let expr = value.slice(1);
        const resolvedExpr = expr.replace(/\{([a-zA-Z_][a-zA-Z0-9_.]*)\}/g, (match, name) => {
            let pieces = name.split(".");
            if (pieces[0] === "res") {
                return opts.target[pieces[1]] ?? 1;
            }
            return null;
        });

        try {
            return new Function(`return ${resolvedExpr};`)();
        } catch (err) {
            throw new Error(`Invalid expression after substitution: ${resolvedExpr}`);
        }
    }

    let [clash, damage] = skill.coins.reduce(([clash, damage, roll], coin, coinIndex) => {
        let coinPower = skill.coinPower + coinPowerBonus;
        let coinDamageMultiplier = damageMultiplier;
        let coinReuseDamageMultiplier = 1; // directly multiplied, start as 1
        let coinHeadsDamageMultiplier = 0; // added to regular multiplier, start as 0
        let coinCritMultiplier = critMultiplier;
        let coinDamageAdder = 0;
        let coinReuses = 0;
        let critReuses = 0;
        let headReuses = 0;
        let endBonuses = [];
        let newLastCoinBonuses = [];
        let lastCoinDamageAdder = 0;

        if (skill.bonusesEnabled && opts.cond === "all")
            coin.bonuses?.forEach(bonus => {
                switch (bonus.type) {
                    case "coin":
                        coinPower += bonus.value;
                        break;
                    case "damage":
                        if (bonus.extra.cond === "tolastcoin") {
                            newLastCoinBonuses.push(bonus);
                        } else if (bonus.extra.cond === "lastcoinonly") {
                            if ("type" in bonus.extra)
                                lastCoinDamageAdder += evaluateValue(bonus.value) * (opts.target[bonus.extra["type"]] ?? 1);
                            else
                                lastCoinDamageAdder += evaluateValue(bonus.value);
                        } else if (bonus.extra.op === "mul") {
                            if ("type" in bonus.extra) {
                                endBonuses.push(bonus);
                            } else {
                                switch (bonus.extra.cond ?? "") {
                                    case "heads":
                                        coinHeadsDamageMultiplier += evaluateValue(bonus.value);
                                        break;
                                    case "reuse":
                                        coinReuseDamageMultiplier += evaluateValue(bonus.value);
                                        break;
                                    default:
                                        coinDamageMultiplier += evaluateValue(bonus.value);
                                        break;
                                }
                            }
                        } else if (bonus.extra.op === "add") {
                            if ("type" in bonus.extra)
                                coinDamageAdder += evaluateValue(bonus.value) * (opts.target[bonus.extra["type"]] ?? 1);
                            else
                                coinDamageAdder += evaluateValue(bonus.value);
                        }
                        break;
                    case "critdamage":
                        coinCritMultiplier += evaluateValue(bonus.value);
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

        coinDamageMultiplier += p * coinHeadsDamageMultiplier;
        let newRoll = roll;
        let newDamage = 0;
        let headsReuseMultiplier = 1;

        const simulateCoin = (reuse = false, headsReuse = false, lastcoin = false) => {
            newRoll += (p * coinPower);
            let damage = newRoll;

            newLastCoinBonuses.forEach(bonus => lastCoinBonuses.push(bonus));

            if (lastcoin) {
                lastCoinBonuses.forEach(bonus => {
                    if (bonus.extra.op === "mul")
                        if ("type" in bonus.extra) {
                            endBonuses.push(bonus);
                        } else {
                            coinDamageMultiplier += evaluateValue(bonus.value);
                        }
                    else if (bonus.extra.op === "add") {
                        if ("type" in bonus.extra)
                            coinDamageAdder += evaluateValue(bonus.value) * (opts.target[bonus.extra["type"]] ?? 1);
                        else
                            coinDamageAdder += evaluateValue(bonus.value);
                    }
                });
            }

            if (reuse) {
                damage *= coinReuseDamageMultiplier;
            }

            if (headsReuse) {
                headsReuseMultiplier *= p;
                damage *= headsReuseMultiplier;
            }

            if (skill.applyCrits) {
                damage *= (resistMultiplier + 0.2) * (coinDamageMultiplier + coinCritMultiplier);
            } else {
                damage *= resistMultiplier * coinDamageMultiplier;
            }

            damage += coinDamageAdder;
            if (lastcoin) {
                damage += lastCoinDamageAdder;
            }
            if (damage < 1 && !headsReuse) damage = 1;

            let finalDamage = damage;
            endBonuses.forEach(bonus => {
                if (bonus.type === "damage" && bonus.extra.op === "mul") {
                    let addedDamage = damage * evaluateValue(bonus.value);
                    if ("max" in bonus.extra) addedDamage = Math.min(addedDamage, bonus.extra["max"]);
                    finalDamage += addedDamage * (opts.target[bonus.extra.op["type"]] ?? 1);
                }
            });

            newDamage += finalDamage;
        }

        const lastCoinWithoutReuse = coinIndex === skill.coins.length - 1;
        simulateCoin(false, false, lastCoinWithoutReuse && coinReuses + (skill.applyCrits ? critReuses : 0) + headReuses === 0);
        let reuses = coinReuses + (skill.applyCrits ? critReuses : 0);
        for (let i = 0; i < reuses; i++) {
            simulateCoin(true, false, lastCoinWithoutReuse && i === reuses - 1 && headReuses === 0);
        }
        for (let i = 0; i < headReuses; i++) {
            simulateCoin(false, true, lastCoinWithoutReuse && i === headReuses - 1);
        }

        return [clash + (p * coinPower), damage + newDamage, newRoll];
    }, [basePower, 0, basePower]);

    if (skill.atkType) {
        if (offDefLevel > (opts.target.off ?? LEVEL_CAP)) clash += Math.floor((offDefLevel - (opts.target.off ?? LEVEL_CAP)) / 3);
    } else {
        if (offDefLevel > (opts.target.def ?? LEVEL_CAP)) clash += Math.floor((offDefLevel - (opts.target.def ?? LEVEL_CAP)) / 3);
    }

    clash += clashBonus;
    clash = Math.max(clash, 0);

    return [formatter.format(clash), skill.atkType ? formatter.format(damage) : "0"];
}

function CalcCard({ skill, clash, damage }) {
    const otherProps = {};
    const otherStyles = {};
    if (skill.bonusNotes) {
        otherProps["data-tooltip-id"] = "calc-tooltip";
        otherProps["data-tooltip-content"] = skill["bonusNotes"];
        otherStyles["textDecoration"] = "underline";
    }

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
            <span {...otherProps} style={otherStyles}>Clash: {formatter.format(clash)}</span>
            {skill.atkType ?
                <span {...otherProps} style={otherStyles}>Damage: {formatter.format(damage)}</span> :
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

            const otherProps = {};
            const otherStyles = {};
            if (skill.bonusNotes) {
                otherProps["data-tooltip-id"] = "calc-tooltip";
                otherProps["data-tooltip-content"] = skill.bonusNotes;
                otherStyles["textDecoration"] = "underline";
            }

            if (!(label in clashes)) clashes[label] = [];
            if (clashes[label].length !== 0) clashes[label].push(<span key={clashes[label].length}>, </span>);
            clashes[label].push(
                <span key={clashes[label].length} style={{ color: affinityColorMapping[skill.affinity] ?? "#ddd", fontWeight: "bold", ...otherStyles }} {...otherProps}>
                    {clash}
                </span>
            )

            if (!(label in damages)) damages[label] = [];
            if (damages[label].length !== 0) damages[label].push(<span key={damages[label].length}>, </span>);
            damages[label].push(
                <span key={damages[label].length} style={{ color: affinityColorMapping[skill.affinity] ?? "#ddd", fontWeight: "bold", ...otherStyles }} {...otherProps}>
                    {damage}
                </span>
            )
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
    const skillData = {
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

    if ("bonusNotes" in skill) skillData.bonusNotes = skill["bonusNotes"];
    return skillData;
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

        const finalApplyCrits = applyCrits || (opts.crit === "poise" && (skillData.skills[skill.id].critSkill ?? false));

        if (tier in counts) {
            return [
                [...skills, extractSkillData(skillData.skills[skill.id], uptie, level, [tier, counts[tier] + 1], finalApplyCrits)],
                { ...counts, [tier]: counts[tier] + 1 }
            ]
        } else {
            return [
                [...skills, extractSkillData(skillData.skills[skill.id], uptie, level, [tier], finalApplyCrits)],
                { ...counts, [tier]: 1 }
            ]
        }
    }, [[], {}]);

    const defskills = identity.defenseSkillTypes.map(s => {
        const finalApplyCrits = applyCrits || (opts.crit === "poise" && (skillData.skills[s.id].critSkill ?? false));

        return extractSkillData(skillData.skills[s.id], uptie, level, ["Defense"], finalApplyCrits)
    });

    const list = [...atkskills, ...defskills];

    if (list.length === 0) return null;

    return <SkillCalc skills={list} opts={opts} />
}

const egoRanks = ["ZAYIN", "TETH", "HE", "WAW", "ALEPH"];

function EgoSkillCalc({ egos, threadspins, level = LEVEL_CAP, opts }) {
    const egosList = useMemo(() => egos.map((ego, i) => [ego, threadspins ? (threadspins[i] ?? 4) : 4, egoRanks[i]]), [egos, threadspins]);

    const [skillData, skillDataLoading] = useDataMultiple(egosList.filter(([ego]) => ego).map(([ego]) => `egos/${ego.id}`));

    if (skillDataLoading)
        return <div style={{ display: "flex", width: "100%", height: "100%", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            Loading...
        </div>;

    const list = egosList
        .filter(([ego]) => ego)
        .map(([ego, ts, rank]) => {
            const data = skillData[`egos/${ego.id}`];
            const skillList = [...data.awakeningSkills, ...(data.corrosionSkills ?? [])];

            const applyCrits = opts.crit === "all" || (opts.crit === "poise" && ego.statuses.includes("Breath"));

            return skillList.map(skill => {
                const finalApplyCrits = applyCrits || (opts.crit === "poise" && (skill.critSkill ?? false));

                return extractSkillData(skill, ts, level, [rank], finalApplyCrits);
            });
        }).flat();

    if (list.length === 0) return null;

    return <SkillCalc skills={list} opts={opts} />
}

export { IdentitySkillCalc, EgoSkillCalc };
