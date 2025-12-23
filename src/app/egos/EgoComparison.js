import { affinityColorMapping, EgoImg, Icon, replaceStatusVariablesTextOnly, SinnerIcon, useData, useDataMultiple } from "@eldritchtools/limbus-shared-library";
import DropdownButton from "../components/DropdownButton";
import { useState } from "react";
import Link from "next/link";
import AutoScroller from "../components/AutoScroller";
import { capitalizeFirstLetter, ColorResist, paragraphScore, ProcessedText, sinnerMapping } from "../utils";
import SkillCard from "../components/SkillCard";
import PassiveCard, { PassiveCost } from "../components/PassiveCard";
import Coin from "../components/Coin";
import RangeInput from "../components/RangeInput";
import { keywordToIdMapping } from "../keywordIds";
import { generalTooltipProps } from "../components/GeneralTooltip";
import { useBreakpoint } from "@eldritchtools/shared-components";

const options = {
    "stats": "Stats",
    "awa": "Awakening",
    "cor": "Corrosion",
    "skills": "All Skills",
    "pas": "Passive",
}

function ComparisonCardBase({ ego, content }) {
    return <div style={{ display: "flex", flexDirection: "column", padding: "0.5rem", width: "320px", maxHeight: "480px", border: "1px #777 solid", borderRadius: "0.25rem", boxSizing: "border-box", alignItems: "center", gap: "0.2rem" }}>
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", height: "128px" }}>
            <Link href={`/egos/${ego.id}`}>
                <EgoImg ego={ego} type={"awaken"} displayName={true} displayRarity={true} size={128} />
            </Link>
        </div>
        <div style={{ border: "1px #777 solid", width: "90%" }} />
        <div style={{ maxHeight: "320px", width: "100%" }}>
            {content}
        </div>
    </div >
}

function ComparisonRowBase({ ego, content }) {
    return <>
        {content.map((line, i) => <tr key={i} style={{ borderTop: "1px #777 solid", borderBottom: "1px #777 solid", verticalAlign: "middle" }}>
            {i === 0 ?
                <td key={0} rowSpan={content.length} style={{ borderTop: "1px #777 solid", borderBottom: "1px #777 solid", verticalAlign: "middle" }}>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", padding: "0.2rem" }}>
                        <Link href={`/egos/${ego.id}`}>
                            <EgoImg ego={ego} type={"awaken"} displayName={true} displayRarity={true} size={128} />
                        </Link>
                    </div>
                </td> :
                null
            }

            {line.map((piece, i) =>
                <td key={i + 1} style={{ borderTop: "1px #777 solid", borderBottom: "1px #777 solid", verticalAlign: "middle" }}>
                    {piece}
                </td>)
            }
        </tr>
        )}
    </>
}

function ComparisonCard({ ego, skillList, compareType }) {
    if (compareType === "stats") {
        const content = <div style={{ display: "grid", gridTemplateColumns: "repeat(8, max-content)", gap: "0.2rem", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div />
            {["wrath", "lust", "sloth", "gluttony", "gloom", "pride", "envy"].map((affinity, i) =>
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon path={affinity} style={{ width: "32px" }} />
                </div>
            )}
            <div style={{ textAlign: "end" }}>Cost:</div>
            {["wrath", "lust", "sloth", "gluttony", "gloom", "pride", "envy"].map((affinity, i) =>
                !ego.cost[affinity] ?
                    <span key={i + 7} style={{ color: "#777" }}>x0</span> :
                    <span key={i + 7}>x{ego.cost[affinity]}</span>
            )}
            <div style={{ textAlign: "end" }}>Res:</div>
            {["wrath", "lust", "sloth", "gluttony", "gloom", "pride", "envy"].map((affinity, i) =>
                <span key={i + 14}><ColorResist resist={ego.resists[affinity]} /></span>
            )}
        </div>

        return <ComparisonCardBase ego={ego} content={content} />
    }

    const contentComponent = <AutoScroller fade={false}>
        <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "0.1rem" }}>
            {skillList.map(([type, skill], ind) => <div key={ind}>
                {type === "awa" ?
                    <SkillCard skill={skill} mini={true} type={"awakening"} /> :
                    type === "cor" ?
                        <SkillCard skill={skill} mini={true} type={"corrosion"} /> :
                        <PassiveCard passive={skill} mini={true} />
                }
            </div>)}
        </div>
    </AutoScroller>

    return <ComparisonCardBase ego={ego} content={contentComponent} />
}

function ComparisonRow({ ego, skillList, compareType }) {
    if (compareType === "stats") {
        const content = [
            <div key={1} style={{ display: "grid", gridTemplateColumns: "repeat(7, max-content)", gap: "0.5rem", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                {["wrath", "lust", "sloth", "gluttony", "gloom", "pride", "envy"].map((affinity, i) =>
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon path={affinity} style={{ width: "32px" }} />
                    </div>
                )}
                {["wrath", "lust", "sloth", "gluttony", "gloom", "pride", "envy"].map((affinity, i) =>
                    !ego.cost[affinity] ?
                        <span key={i + 7} style={{ color: "#777" }}>x0</span> :
                        <span key={i + 7}>x{ego.cost[affinity]}</span>
                )}
            </div>,
            <div key={2} style={{ display: "grid", gridTemplateColumns: "repeat(7, max-content)", gap: "0.5rem", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                {["wrath", "lust", "sloth", "gluttony", "gloom", "pride", "envy"].map((affinity, i) =>
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon path={affinity} style={{ width: "32px" }} />
                    </div>
                )}
                {["wrath", "lust", "sloth", "gluttony", "gloom", "pride", "envy"].map((affinity, i) =>
                    <span key={i + 7}><ColorResist resist={ego.resists[affinity]} /></span>
                )}
            </div>
        ]

        return <ComparisonRowBase ego={ego} content={[content]} />
    }

    if (["awa", "cor", "skills"].includes(compareType)) {
        const iconSize = "32px";
        const coinSize = "24px";

        const constructCells = ([type, skill, ind], i) => {
            let skillData = skill.data.reduce((acc, dataTier) => ({ ...acc, ...dataTier }), {});
            let skillText = skill.text.reduce((acc, textTier) => ({ ...acc, ...textTier }), {});

            return [
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.2rem", alignItems: "center", maxWidth: "40ch", textAlign: "center" }}>
                    <div style={{ color: "#aaa", fontWeight: "bold" }}>
                        {type === "awa" ? "Awakening" : "Corrosion"}
                    </div>
                    <div style={{ borderRadius: "5px", backgroundColor: affinityColorMapping[skillData.affinity], padding: "5px", color: "#ddd", textShadow: "black 1px 1px 5px", fontWeight: "bold" }}>
                        {skillText.name}
                    </div>
                    <div style={{ display: "flex", flexDirection: "row", gap: "0.25rem", alignItems: "center" }}>
                        {skillData.affinity !== "none" ? <Icon path={skillData.affinity} style={{ width: iconSize }} /> : null}
                        {skillData.defType !== "attack" ? <Icon path={capitalizeFirstLetter(skillData.defType)} style={{ width: iconSize }} /> : null}
                        {skillData.defType === "attack" || skillData.defType === "counter" ? <Icon path={capitalizeFirstLetter(skillData.atkType)} style={{ width: iconSize }} /> : null}
                    </div>
                </div>,

                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.2rem", alignItems: "center" }}>
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
                        {skillData.levelCorrection < 0 ? skillData.levelCorrection : `+${skillData.levelCorrection}`}
                        <span>
                            Atk Weight: {skillData.atkWeight}
                        </span>
                    </span>
                </div>,

                <div key={i} style={{ display: "flex", flexDirection: "column", maxWidth: "100ch" }}>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.2", marginBottom: "0.25rem" }}>
                        {skillText.desc ?
                            <ProcessedText text={skillText.desc} /> :
                            null
                        }
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {skillText.coinDescs ? skillText.coinDescs.map((coinDescs, index) => coinDescs.length > 0 ?
                            <div key={index} style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
                                <Coin num={index + 1} />
                                <div style={{ display: "flex", flex: 1, flexDirection: "column", whiteSpace: "pre-wrap", gap: "0.1rem" }}>
                                    {coinDescs.map((desc, innerIndex) => <ProcessedText key={`${innerIndex}-text`} text={desc} />)}
                                </div>
                            </div> : null
                        ) : null}
                    </div>
                </div>
            ]
        }

        return <ComparisonRowBase ego={ego} content={skillList.map((skill, i) => constructCells(skill, i))} />
    }

    if (compareType === "pas") {
        const iconSize = "32px";

        const constructCells = ([type, passive, ind], i) => {
            return [
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.2rem", alignItems: "center", maxWidth: "40ch", textAlign: "center" }}>
                    <div style={{ borderRadius: "5px", backgroundColor: "grey", padding: "5px", color: "#ddd", textShadow: "black 1px 1px 5px", fontWeight: "bold" }}>
                        {passive.name}
                    </div>
                </div>,

                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.2rem", alignItems: "center", padding: "0.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "row", gap: "0.25rem" }}>
                        {"condition" in passive ? <PassiveCost condition={passive.condition} iconSize={iconSize} vertical={true} /> : null}
                    </div>
                </div>,

                <div key={i} style={{ display: "flex", flexDirection: "column", maxWidth: "100ch" }}>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.2" }}>
                        <ProcessedText text={passive.desc} />
                    </div>
                </div>
            ]
        }

        return <ComparisonRowBase ego={ego} content={skillList.map((skill, i) => constructCells(skill, i))} />
    }

    return null;
}

function ComparisonList({ items, compareType, displayType, otherOpts }) {
    const [statuses, statusesLoading] = useData("statuses", compareType !== "stats");
    const { isMobile } = useBreakpoint();

    if (statusesLoading && displayType !== "stats" && otherOpts.searchString.trim().length > 0) return null;

    const attachSearchScores = (list) =>
        list.map(([ego, skills]) => {
            const pieces = [];
            skills.forEach(([t, skill, i]) => {
                if (t === "awa" || t === "cor") {
                    let skillText = skill.text.reduce((acc, textTier) => ({ ...acc, ...textTier }), {});
                    pieces.push(replaceStatusVariablesTextOnly(skillText.desc, statuses));
                    if (skillText.coinDescs) {
                        skillText.coinDescs.forEach(coinDescs =>
                            coinDescs.forEach(desc =>
                                pieces.push(replaceStatusVariablesTextOnly(desc, statuses))
                            )
                        )
                    }
                } else if (t === "pas") {
                    pieces.push(replaceStatusVariablesTextOnly(skill.desc, statuses));
                }
            })

            const score = paragraphScore(otherOpts.searchString, pieces.join(" | "))

            return [ego, skills, score];
        })

    const outsideInterval = (val, [min, max]) => val < min || val > max;

    const filterList = (list) => {
        if (compareType === "stats")
            return list.filter(([ego, skills]) => {
                if (Object.entries(ego.cost).some(([affinity, value]) =>
                    otherOpts.maxCost[keywordToIdMapping[affinity] - 8] < value
                )) return false;

                if (Object.entries(ego.resists).some(([affinity, value]) =>
                    otherOpts.maxRes[keywordToIdMapping[affinity] - 8] < value
                )) return false;

                return true;
            })

        if (["awa", "cor", "skills"].includes(compareType))
            return list.filter(x => {
                if (x.length === 3 && otherOpts.searchString.trim().length > 0 && x[2] === 0) return false;

                return x[1].some(([type, skill, i]) => {
                    let skillData = skill.data.reduce((acc, dataTier) => ({ ...acc, ...dataTier }), {});
                    if (outsideInterval(skillData.baseValue, otherOpts.basePower)) return false;
                    if (outsideInterval(skillData.coinValue, otherOpts.coinPower)) return false;
                    if (outsideInterval(skillData.coinTypes.length, otherOpts.coins)) return false;
                    if (outsideInterval(skillData.levelCorrection, otherOpts.levelOffset)) return false;
                    if (outsideInterval(skillData.atkWeight, otherOpts.atkWeight)) return false;
                    return true;
                });
            })

        if (compareType === "pas")
            return list.filter(x => {
                if (x.length === 3 && otherOpts.searchString.trim().length > 0 && x[2] === 0) return false;
                return true;
            })

        return [];
    }

    const initialList = compareType === "stats" ?
        items :
        otherOpts.searchString.trim().length > 0 ?
            attachSearchScores(items) : items

    const sortList = (list) => {
        if (compareType === "stats") {
            let sorted = list;
            if (otherOpts.sortType === "total cost") {
                sorted = list
                    .map(([x, s]) => [[x, s], Object.values(x.cost).reduce((acc, cost) => acc + cost, 0)])
                    .sort((a, b) => a[1] - b[1])
                    .map(([x, cost]) => x)
            } else if (otherOpts.sortType.includes("cost")) {
                const [affinity] = otherOpts.sortType.split(" ");
                sorted = list.sort(([ax, as], [bx, bs]) => (ax.cost[affinity] ?? 0) - (bx.cost[affinity] ?? 0))
            } else if (otherOpts.sortType.includes("resist")) {
                const [affinity] = otherOpts.sortType.split(" ");
                sorted = list.sort(([ax, as], [bx, bs]) => (ax.resists[affinity] ?? 0) - (bx.resists[affinity] ?? 0))
            }

            return otherOpts.sortAscending ? sorted : sorted.reverse();
        }

        if (["awa", "cor", "skills"].includes(compareType)) {
            let sorted = list;

            const attachData = ([id, sks]) => {
                const skills = sks.map(([t, skill, i]) => [t, skill, i, skill.data.reduce((acc, dataTier) => ({ ...acc, ...dataTier }), {})]);
                return [id, skills];
            }

            switch (otherOpts.sortType) {
                case "search match score":
                    sorted = list.sort(([a, as, asc], [b, bs, bsc]) => asc - bsc);
                    break;
                case "base power":
                    sorted = list.map(x => attachData(x)).sort(([a, as], [b, bs]) => {
                        const at = as.reduce((acc, [t, sk, i, skd]) => acc + skd.baseValue, 0);
                        const bt = bs.reduce((acc, [t, sk, i, skd]) => acc + skd.baseValue, 0);
                        return at - bt;
                    })
                    break;
                case "coin power":
                    sorted = list.map(x => attachData(x)).sort(([a, as], [b, bs]) => {
                        const at = as.reduce((acc, [t, sk, i, skd]) => acc + skd.coinValue, 0);
                        const bt = bs.reduce((acc, [t, sk, i, skd]) => acc + skd.coinValue, 0);
                        return at - bt;
                    })
                    break;
                case "coins":
                    sorted = list.map(x => attachData(x)).sort(([a, as], [b, bs]) => {
                        const at = as.reduce((acc, [t, sk, i, skd]) => acc + skd.coinTypes.length, 0);
                        const bt = bs.reduce((acc, [t, sk, i, skd]) => acc + skd.coinTypes.length, 0);
                        return at - bt;
                    })
                    break;
                case "level offset":
                    sorted = list.map(x => attachData(x)).sort(([a, as], [b, bs]) => {
                        const at = as.reduce((acc, [t, sk, i, skd]) => acc + skd.levelCorrection, 0);
                        const bt = bs.reduce((acc, [t, sk, i, skd]) => acc + skd.levelCorrection, 0);
                        return at - bt;
                    })
                    break;
                case "atk weight":
                    sorted = list.map(x => attachData(x)).sort(([a, as], [b, bs]) => {
                        const at = as.reduce((acc, [t, sk, i, skd]) => acc + skd.atkWeight, 0);
                        const bt = bs.reduce((acc, [t, sk, i, skd]) => acc + skd.atkWeight, 0);
                        return at - bt;
                    })
                    break;
                default: break;
            }
            return otherOpts.sortAscending ? sorted : sorted.reverse();
        }

        if (compareType === "pas") {
            let sorted = list;

            switch (otherOpts.sortType) {
                case "search match score":
                    sorted = list.sort(([a, as, asc], [b, bs, bsc]) => asc - bsc);
                    break;
                default: break;
            }
            return otherOpts.sortAscending ? sorted : sorted.reverse();
        }

        return list;
    }

    const sortedList = sortList(filterList(initialList));

    if (displayType === "card") {
        return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 320px)", width: "100%", gap: "0.2rem", justifyContent: "center" }}>
            {sortedList.map(([ego, skills], i) => <ComparisonCard key={i} ego={ego} skillList={skills} compareType={compareType} />)}
        </div>
    } else if (displayType === "full") {
        return <div style={{ display: "flex", overflowX: "auto", width: "100%", justifyContent: isMobile ? "start" : "center", overflowY: "hidden" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: compareType === "stats" ? "800px" : "1600px" }}>
                {
                    compareType === "stats" ?
                        <thead>
                            <tr style={{ height: "1.25rem" }}>
                                <th>E.G.O</th>
                                <th>Costs</th>
                                <th>Resists</th>
                            </tr>
                        </thead> :
                        ["awa", "cor", "skills"].includes(compareType) ?
                            <thead>
                                <tr style={{ height: "1.25rem" }}>
                                    <th>E.G.O</th>
                                    <th>Info</th>
                                    <th>Details</th>
                                    <th>Description</th>
                                </tr>
                            </thead> :
                            <thead>
                                <tr style={{ height: "1.25rem" }}>
                                    <th>E.G.O</th>
                                    <th>Info</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                }
                <tbody>
                    {sortedList.map(([ego, skills], i) => <ComparisonRow key={i} ego={ego} skillList={skills} compareType={compareType} />)}
                </tbody>
            </table>
        </div>
    } else {
        return null;
    }
}

const splitBySinner = list => list.reduce((acc, [id, ego]) => {
    if (ego.sinnerId in acc) acc[ego.sinnerId].push([id, ego]);
    else acc[ego.sinnerId] = [[id, ego]];
    return acc;
}, {});

const getSkillList = (ego, t, skillData) => {
    if (t === "awa") return skillData.awakeningSkills.map(skill => ["awa", skill]);
    if (t === "cor") return ("corrosionSkills" in skillData) ? skillData.corrosionSkills.map(skill => ["cor", skill]) : [];
    if (t === "skills")
        return [
            ...getSkillList(ego, "awa", skillData),
            ...getSkillList(ego, "cor", skillData)
        ]
    if (t === "pas") return skillData.passiveList.map(passive => ["pas", passive])
    return []
}

export default function EgoComparison({ egos, displayType, separateSinners }) {
    const [compareType, setCompareType] = useState("stats");
    const [searchString, setSearchString] = useState("");
    const [maxCost, setMaxCost] = useState([9, 9, 9, 9, 9, 9, 9]);
    const [maxRes, setMaxRes] = useState([2, 2, 2, 2, 2, 2, 2]);
    const [basePower, setBasePower] = useState([0, 99]);
    const [coinPower, setCoinPower] = useState([-99, 99]);
    const [coins, setCoins] = useState([0, 9]);
    const [levelOffset, setLevelOffset] = useState([-9, 9]);
    const [atkWeight, setAtkWeight] = useState([1, 9]);
    const [sortType, setSortType] = useState("default");
    const [sortAscending, setSortAscending] = useState(true);
    const [grouped, setGrouped] = useState(true);

    const paths = useMemo(() => egos.map(([id, _]) => `egos/${id}`), [egos]);
    const [skillData, skillDataLoading] = useDataMultiple(paths);

    if (skillDataLoading)
        return <div style={{ display: "flex", flexDirection: "column" }}>
            <h2>Loading data...</h2>
        </div>;

    const egoListToItems = list => list.reduce((acc, [id, ego]) => {
        if (compareType === "stats") {
            acc.push([ego, []]);
            return acc;
        }

        const list = getSkillList(ego, compareType, skillData[`egos/${id}`]);
        if (grouped) acc.push([ego, list]);
        else list.forEach(skill => acc.push([ego, [skill]]));
        return acc;
    }, [])

    const listComponents = separateSinners ?
        Object.entries(splitBySinner(egos)).map(([sinnerId, egoList]) => {
            return [
                <div key={sinnerId} style={{ display: "flex", flexDirection: "row", alignItems: "center", fontSize: "1.2rem", fontWeight: "bold", padding: "0.5rem 0rem" }}>
                    <SinnerIcon num={sinnerId} style={{ height: "48px" }} />
                    {sinnerMapping[sinnerId]}
                </div>,
                egoListToItems(egoList)
            ]
        }) :
        egoListToItems(egos);

    const otherOpts = {
        searchString: searchString,
        maxCost: maxCost,
        maxRes: maxRes,
        basePower: basePower,
        coinPower: coinPower,
        coins: coins,
        levelOffset: levelOffset,
        atkWeight: atkWeight,
        sortType: sortType,
        sortAscending: sortAscending
    }

    const sortOptions =
        compareType === "stats" ?
            {
                "default": "default",
                "total cost": "total cost",
                "wrath cost": "wrath cost",
                "lust cost": "lust cost",
                "sloth cost": "sloth cost",
                "gluttony cost": "gluttony cost",
                "gloom cost": "gloom cost",
                "pride cost": "pride cost",
                "envy cost": "envy cost",
                "wrath resist": "wrath resist",
                "lust resist": "lust resist",
                "sloth resist": "sloth resist",
                "gluttony resist": "gluttony resist",
                "gloom resist": "gloom resist",
                "pride resist": "pride resist",
                "envy resist": "envy resist",
            } :
            ["awa", "cor", "skills"].includes(compareType) ?
                {
                    "default": "default",
                    "search match score": "search match score",
                    "base power": "base power",
                    "coin power": "coin power",
                    "coins": "coins",
                    "level offset": "level offset",
                    "atk weight": "atk weight"
                } :
                ["pas"].includes(compareType) ?
                    {
                        "default": "default",
                        "search match score": "search match score"
                    } :
                    {
                        "default": "default"
                    };

    const filterStyle = { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }

    return <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center", gap: "0.2rem" }}>
        <span style={{ fontSize: "0.9rem", wordWrap: "wrap" }}>
            Warning: Some combinations of settings may cause the webpage to lag due to the number of things being rendered, especially when using &quot;All Skills&quot;.
            Try using filters if this happens.
        </span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span>Compare Target:</span>
                <DropdownButton value={compareType} setValue={setCompareType} options={options} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span>Sort:</span>
                <DropdownButton value={sortType} setValue={setSortType} options={sortOptions} />
                <button onClick={() => setSortAscending(p => !p)}>
                    {sortAscending ? "ascending" : "descending"}
                </button>
            </div>
            {compareType !== "stats" ?
                <label>
                    <input type="checkbox" checked={grouped} onChange={e => setGrouped(p => !p)} />
                    <span {...generalTooltipProps("groupedComp")} style={{ borderBottom: "1px #777 dotted" }}>Grouped by E.G.O</span>
                </label> : null
            }
        </div>
        <div style={{ display: "flex", alignItems: "start", flexWrap: "wrap", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            {compareType === "stats" ? <>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center"}}>
                    <div style={filterStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            <span>Max Cost:</span>
                            <button onClick={() => setMaxCost([0, 0, 0, 0, 0, 0, 0])}>Set all 0</button>
                            <button onClick={() => setMaxCost([9, 9, 9, 9, 9, 9, 9])}>Set all 9</button>
                        </div>
                        <div style={{ display: "flex" }}>
                            {["wrath", "lust", "sloth", "gluttony", "gloom", "pride", "envy"].map((affinity, i) =>
                                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <Icon path={affinity} style={{ width: "32px" }} />
                                    <input type="number" min={0} max={9} value={maxCost[i]}
                                        onChange={e => setMaxCost(p => p.map((x, ind) => ind === i ? Number(e.target.value) : x))}
                                        style={{ width: "3ch", textAlign: "center" }}
                                    />
                                </div>)}
                        </div>
                    </div>
                    <div style={filterStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            <span>Max Resists:</span>
                            <button onClick={() => setMaxRes([1, 1, 1, 1, 1, 1, 1])}>Set all 1</button>
                            <button onClick={() => setMaxRes([2, 2, 2, 2, 2, 2, 2])}>Set all 2</button>
                        </div>
                        <div style={{ display: "flex" }}>
                            {["wrath", "lust", "sloth", "gluttony", "gloom", "pride", "envy"].map((affinity, i) =>
                                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <Icon path={affinity} style={{ width: "32px" }} />
                                    <input type="number" min={0} max={2} value={maxRes[i]}
                                        onChange={e => setMaxRes(p => p.map((x, ind) => ind === i ? Number(e.target.value) : x))}
                                        style={{ width: "3ch", textAlign: "center" }}
                                    />
                                </div>)}
                        </div>
                    </div>
                </div>
            </> :
                ["awa", "cor", "skills"].includes(compareType) ?
                    <>
                        <div style={filterStyle}>
                            <div style={{ display: "flex", height: "32px", alignItems: "center" }}>
                                <span {...generalTooltipProps("descSearch")} style={{ borderBottom: "1px #777 dotted" }}>
                                    Search in Description:
                                </span>
                            </div>
                            <input value={searchString} onChange={e => setSearchString(e.target.value)} />
                        </div>
                        <div style={filterStyle}>
                            <span style={{ display: "flex", height: "32px", alignItems: "center" }}>Base Power:</span>
                            <RangeInput min={0} max={99} value={basePower} onChange={setBasePower} />
                        </div>
                        <div style={filterStyle}>
                            <span style={{ display: "flex", height: "32px", alignItems: "center" }}>Coin Power:</span>
                            <RangeInput min={-99} max={99} value={coinPower} onChange={setCoinPower} />
                        </div>
                        <div style={filterStyle}>
                            <span style={{ display: "flex", height: "32px", alignItems: "center" }}>Coins:</span>
                            <RangeInput min={0} max={9} value={coins} onChange={setCoins} />
                        </div>
                        <div style={filterStyle}>
                            <span style={{ display: "flex", alignItems: "center" }}>
                                <Icon path={"offense level"} style={{ width: "32px", height: "32px" }} /> /
                                <Icon path={"defense level"} style={{ width: "32px", height: "32px" }} />
                            </span>
                            <RangeInput min={-9} max={9} value={levelOffset} onChange={setLevelOffset} />
                        </div>
                        <div style={filterStyle}>
                            <span style={{ display: "flex", height: "32px", alignItems: "center" }}>Atk Weight:</span>
                            <RangeInput min={-9} max={9} value={atkWeight} onChange={setAtkWeight} />
                        </div>
                    </> : <>
                        <div style={filterStyle}>
                            <span {...generalTooltipProps("descSearch")} style={{ borderBottom: "1px #777 dotted" }}>
                                Search in Description:
                            </span>
                            <input value={searchString} onChange={e => setSearchString(e.target.value)} />
                        </div>
                    </>
            }
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            {displayType === "icon" ?
                <h2>Icons display type not supported</h2> :
                (separateSinners ?
                    listComponents.map(([sep, list], i) => <>
                        {sep}
                        <ComparisonList key={`${i}-2`} items={list} compareType={compareType} displayType={displayType} otherOpts={otherOpts} />
                    </>) :
                    <ComparisonList items={listComponents} compareType={compareType} displayType={displayType} otherOpts={otherOpts} />
                )
            }
        </div>
    </div>

}
