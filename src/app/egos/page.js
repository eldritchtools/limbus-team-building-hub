"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon, EgoImg, RarityImg, SinnerIcon, Status, statuses, useData } from "@eldritchtools/limbus-shared-library";
import { capitalizeFirstLetter, ColorResist, getSeasonString, sinnerMapping } from "../utils";
import { selectStyle } from "../styles";
import dynamic from "next/dynamic";
import Link from "next/link";
import "./egos.css";
import EgoComparisonAdvanced from "./EgoComparisonAdvanced";
import DropdownButton from "../components/DropdownButton";
import EgoComparisonBasic from "./EgoComparisonBasic";
const Select = dynamic(() => import("react-select"), { ssr: false });

const mainFilters = {
    "tier": ["zayin", "teth", "he", "waw", "aleph"],
    "sinner": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    "keyword": ["Burn", "Bleed", "Tremor", "Rupture", "Sinking", "Poise", "Charge"],
    "affinity": ["wrath", "lust", "sloth", "gluttony", "gloom", "pride", "envy"],
    "skillType": ["Slash", "Pierce", "Blunt"]
}

const keywordMapping = {
    "Burn": "Combustion",
    "Bleed": "Laceration",
    "Tremor": "Vibration",
    "Rupture": "Burst",
    "Sinking": "Sinking",
    "Poise": "Breath",
    "Charge": "Charge"
}

const mainFiltersMapping = Object.entries(mainFilters).reduce((acc, [type, list]) => list.reduce((acc2, filter) => { acc2[filter] = type; return acc2 }, acc), {});

function SkillTypeIcons({ skill }) {
    return <div style={{ display: "flex", flexDirection: "column" }}>
        <Icon path={skill.affinity} style={{ height: "32px" }} />
        <Icon path={capitalizeFirstLetter(skill.type)} style={{ height: "32px" }} />
    </div>
}

function EgoDetails({ id, ego }) {
    const wrapCell = contents => <td style={{ borderTop: "1px #777 solid", borderBottom: "1px #777 solid", verticalAlign: "middle" }}>
        <Link key={id} href={`/egos/${id}`} style={{ color: "#ddd", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "128px" }}>
            {contents}
        </Link>
    </td>

    return <tr className="clickable-table-row">
        {wrapCell(<div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0.5rem" }}>
            <RarityImg rarity={ego.rank.toLowerCase()} style={{ height: "32px" }} />
        </div>)}
        {wrapCell(<div style={{ display: "flex", justifyContent: "center", padding: "0.1rem" }}>
            <EgoImg ego={ego} type={"awaken"} scale={0.5} />
            {"corrosionType" in ego ? <EgoImg ego={ego} type={"erosion"} scale={0.5} /> : null}
        </div>)}
        {wrapCell(<div style={{ textAlign: "center", gap: "0.2rem" }}>
            {ego.name}<br />{sinnerMapping[ego.sinnerId]}
        </div>)}
        {wrapCell(<SkillTypeIcons skill={ego.awakeningType} />)}
        {wrapCell("corrosionType" in ego ? <SkillTypeIcons skill={ego.corrosionType} /> : null)}
        {wrapCell(<div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(32px, 1fr))", width: "100%" }}>
            {mainFilters.affinity.map(affinity => <div key={affinity} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "0.25rem" }}>
                <Icon path={affinity} style={{ height: "32px", width: "32px" }} />
                <span>{affinity in ego.cost ? ego.cost[affinity] : <span style={{ color: "#777" }}>0</span>}</span>
                <span>{<ColorResist resist={ego.resists[affinity]} />}</span>
            </div>)}
        </div>)}
        {wrapCell(<div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", maxWidth: "75ch", padding: "0.5rem", gap: "0.5rem", textAlign: "center" }}>
            {(ego.keywordTags || ego.statuses).sort().map(keyword => <Status key={keyword} id={keyword} style={{ height: "32px" }} />)}
        </div>)}
    </tr>
}

function EgoCard({ ego }) {
    return <div className="clickable-ego-card" style={{ display: "flex", flexDirection: "row", padding: "0.5rem", width: "min(420px, 100%)", height: "280px", border: "1px #777 solid", borderRadius: "0.25rem", boxSizing: "border-box" }}>
        <div style={{ display: "flex", flexDirection: "column", width: "128px" }}>
            <EgoImg ego={ego} type={"awaken"} displayName={false} displayRarity={true} />
            {"corrosionType" in ego ? <EgoImg ego={ego} type={"erosion"} displayName={false} displayRarity={false} /> : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "0.5rem", alignItems: "center", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                {/* <RarityImg rarity={ego.rank.toLowerCase()} style={{ height: "32px" }} /> */}
                <span style={{ flex: 1 }}>{ego.name}</span>
            </div>
            <div style={{ display: "flex", gap: "2rem" }}>
                <SkillTypeIcons skill={ego.awakeningType} />
                {"corrosionType" in ego ? <SkillTypeIcons skill={ego.corrosionType} /> : null}
            </div>
            Cost
            <div style={{ display: "flex", gap: "0.25rem" }}>
                {Object.entries(ego.cost).map(([affinity, cost]) => <div key={affinity} style={{ display: "flex", flexDirection: "column" }}>
                    <Icon path={affinity} style={{ height: "32px", width: "32px" }} />
                    <span>{cost}</span>
                </div>)}
            </div>
        </div>
    </div>
}

function includesIgnoreCase(s1, s2) {
    return s1.toLowerCase().includes(s2.toLowerCase());
}

function checkSearchMatch(searchString, ego) {
    if (includesIgnoreCase(ego.name, searchString)) return true;
    return false;
}

function EgoList({ egos, searchString, selectedMainFilters, displayType, separateSinners, strictFiltering, selectedStatuses, selectedSeasons, compareMode }) {
    const filters = useMemo(() => selectedMainFilters.reduce((acc, filter) => {
        if (mainFiltersMapping[filter] in acc) acc[mainFiltersMapping[filter]].push(filter);
        else acc[mainFiltersMapping[filter]] = [filter];
        return acc;
    }, {}), [selectedMainFilters])

    const list = useMemo(() => Object.entries(egos).filter(([_id, ego]) => {
        if (searchString !== "" && !checkSearchMatch(searchString, ego)) return false;

        for (const type in filters) {
            if (type === "tier") {
                if (strictFiltering) {
                    if (!filters[type].every(x => x === ego.rank.toLowerCase())) return false;
                } else {
                    if (!filters[type].some(x => x === ego.rank.toLowerCase())) return false;
                }
            } else if (type === "affinity") {
                if (strictFiltering) {
                    if (!filters[type].every(x => ego.awakeningType.affinity === x || ("corrosionType" in ego && ego.corrosionType.affinity === x))) return false;
                } else {
                    if (!filters[type].some(x => ego.awakeningType.affinity === x || ("corrosionType" in ego && ego.corrosionType.affinity === x))) return false;
                }
            } else if (type === "skillType") {
                if (strictFiltering) {
                    if (!filters[type].every(x => ego.awakeningType.type === x.toLowerCase() || ("corrosionType" in ego && ego.corrosionType.type === x.toLowerCase()))) return false;
                } else {
                    if (!filters[type].some(x => ego.awakeningType.type === x.toLowerCase() || ("corrosionType" in ego && ego.corrosionType.type === x.toLowerCase()))) return false;
                }
            } else if (type === "keyword") {
                if (strictFiltering) {
                    if (!filters[type].every(x => (ego.keywordTags || ego.statuses).includes(keywordMapping[x]))) return false;
                } else {
                    if (!filters[type].some(x => (ego.keywordTags || ego.statuses).includes(keywordMapping[x]))) return false;
                }
            } else if (type === "sinner") {
                if (strictFiltering) {
                    if (!filters[type].every(x => x === ego.sinnerId)) return false;
                } else {
                    if (!filters[type].some(x => x === ego.sinnerId)) return false;
                }
            }
        }

        if (selectedStatuses.length !== 0) {
            if (strictFiltering) {
                if (!selectedStatuses.every(statusOption => (ego.keywordTags || ego.statuses).includes(statusOption.value))) return false;
            } else {
                if (!selectedStatuses.some(statusOption => (ego.keywordTags || ego.statuses).includes(statusOption.value))) return false;
            }
        }

        if (selectedSeasons.length !== 0) {
            if (strictFiltering) {
                if (!selectedSeasons.every(season => season.value === ego.season || (season.value === 9100 && ego.season > 9100))) return false;
            } else {
                if (!selectedSeasons.some(season => season.value === ego.season || (season.value === 9100 && ego.season > 9100))) return false;
            }
        }

        return true;
    }), [searchString, filters, egos, selectedStatuses, selectedSeasons, strictFiltering]);

    if (compareMode === "basic") {
        return <EgoComparisonBasic />
    }

    if (compareMode === "adv") {
        return <EgoComparisonAdvanced
            egos={list}
            displayType={displayType}
            separateSinners={separateSinners}
        />
    }

    const splitBySinner = list => list.reduce((acc, [id, ego]) => {
        if (ego.sinnerId in acc) acc[ego.sinnerId].push([id, ego]);
        else acc[ego.sinnerId] = [[id, ego]];
        return acc;
    }, {})

    if (displayType === "icon") {
        const listToComponents = list => <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))", width: "100%", gap: "0.5rem" }}>
            {list.map(([id, ego]) => <div key={id}><Link href={`/egos/${id}`} style={{ color: "#ddd", textDecoration: "none" }}>
                <div className="clickable-ego">
                    <EgoImg ego={ego} type={"awaken"} displayName={true} displayRarity={true} />
                </div>
            </Link></div>)}
        </div>

        if (separateSinners) {
            return <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                {Object.entries(splitBySinner(list)).map(([sinnerId, list]) => [
                    <div key={sinnerId} style={{ display: "flex", flexDirection: "row", alignItems: "center", fontSize: "1.2rem", fontWeight: "bold" }}>
                        <SinnerIcon num={sinnerId} style={{ height: "48px" }} />
                        {sinnerMapping[sinnerId]}
                    </div>,
                    <div key={`${sinnerId}-list`}>
                        {listToComponents(list)}
                    </div>
                ]).flat()}
            </div>
        } else {
            return listToComponents(list);
        }
    } else if (displayType === "card") {
        const listToComponents = list => <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, min(420px, 100%))", width: "100%", gap: "0.5rem", justifyContent: "center" }}>
            {list.map(([id, ego]) => <div key={id}><Link href={`/egos/${id}`} style={{ color: "#ddd", textDecoration: "none" }}><EgoCard key={id} ego={ego} /></Link></div>)}
        </div>

        if (separateSinners) {
            return <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                {Object.entries(splitBySinner(list)).map(([sinnerId, list]) => [
                    <div key={sinnerId} style={{ display: "flex", flexDirection: "row", alignItems: "center", fontSize: "1.2rem", fontWeight: "bold" }}>
                        <SinnerIcon num={sinnerId} style={{ height: "48px" }} />
                        {sinnerMapping[sinnerId]}
                    </div>,
                    <div key={`${sinnerId}-list`}>
                        {listToComponents(list)}
                    </div>
                ]).flat()}
            </div>
        } else {
            return listToComponents(list);
        }
    } else if (displayType === "full") {
        return <div style={{ display: "flex", overflowX: "auto", width: "100%" }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                    <tr style={{ height: "1.25rem" }}>
                        <th>Rank</th>
                        <th>Icon</th>
                        <th>Name</th>
                        <th>Awakening</th>
                        <th>Corrosion</th>
                        <th>Costs/Resists</th>
                        <th>Statuses</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        separateSinners ?
                            Object.entries(splitBySinner(list)).map(([sinnerId, list]) => [
                                <tr key={sinnerId}><td colSpan={7} style={{ borderTop: "1px #777 solid", borderBottom: "1px #777 solid" }}>
                                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", fontSize: "1.2rem", fontWeight: "bold", }}>
                                        <SinnerIcon num={sinnerId} style={{ height: "48px" }} />
                                        {sinnerMapping[sinnerId]}
                                    </div>
                                </td></tr>,
                                list.map(([id, ego]) => <EgoDetails key={id} id={id} ego={ego} />)
                            ]).flat() :
                            list.map(([id, ego]) => <EgoDetails key={id} id={id} ego={ego} />)
                    }
                </tbody>
            </table>
        </div>
    } else {
        return null;
    }
}

function MainFilterSelector({ selectedMainFilters, setSelectedMainFilters }) {
    const handleToggle = (filter, selected) => {
        if (selected)
            setSelectedMainFilters(prev => prev.filter(x => x !== filter));
        else
            setSelectedMainFilters(prev => [...prev, filter]);
    }

    const clearAll = () => {
        setSelectedMainFilters([]);
    }

    const toggleComponent = (filter, selected) => {
        return <div key={filter} style={{
            backgroundColor: selected ? "#3f3f3f" : "#1f1f1f", height: "32px", display: "flex",
            alignItems: "center", justifyContent: "center", padding: "0.1rem 0.2rem", cursor: "pointer",
            borderBottom: selected ? "2px #4caf50 solid" : "transparent"
        }}
            onClick={() => handleToggle(filter, selected)}
        >
            {Number.isInteger(filter) ? <SinnerIcon num={filter} style={{ height: "32px" }} /> : <Icon path={filter} style={{ height: "32px" }} />}
        </div>
    }

    return <div style={{ display: "flex", flexDirection: "column", border: "1px #777 dotted", borderRadius: "1rem", minWidth: "200px", padding: "0.5rem" }}>
        {
            Object.entries(mainFilters).map(([category, list]) => {
                if (category === "tier") {
                    return <div key={category} style={{ display: "flex", flexDirection: "column", borderBottom: "1px #777 dotted" }}>
                        <div style={{ display: "flex", justifyContent: "center", padding: "0.2rem" }}>
                            {list.slice(0, 3).map(filter => toggleComponent(filter, selectedMainFilters.includes(filter)))}
                        </div>
                        <div style={{ display: "flex", justifyContent: "center", padding: "0.2rem" }}>
                            {list.slice(3, 5).map(filter => toggleComponent(filter, selectedMainFilters.includes(filter)))}
                        </div>
                    </div>
                } else if (category === "sinner") {
                    return <div key={category} style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", padding: "0.2rem", borderBottom: "1px #777 dotted" }}>
                        {list.map(filter => toggleComponent(filter, selectedMainFilters.includes(filter)))}
                    </div>
                } else {
                    return <div key={category} style={{ display: "flex", justifyContent: "center", padding: "0.2rem", borderBottom: "1px #777 dotted" }}>
                        {list.map(filter => toggleComponent(filter, selectedMainFilters.includes(filter)))}
                    </div>
                }
            })
        }
        {<div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "0.5rem", cursor: "pointer" }} onClick={clearAll}>Clear All</div>}
    </div>
}

function MultiSelector({ options, selected, setSelected, placeholder }) {
    return <Select
        isMulti
        options={options}
        value={selected}
        onChange={setSelected}
        placeholder={placeholder}
        isClearable={true}
        styles={selectStyle}
        filterOption={(candidate, input) => candidate.data.name.toLowerCase().includes(input.toLowerCase())}
    />;
}

export default function EgosPage() {
    const [egos, egosLoading] = useData("egos");

    const [searchString, setSearchString] = useState("");
    const [selectedMainFilters, setSelectedMainFilters] = useState([]);
    const [displayType, setDisplayType] = useState(null);
    const [strictFiltering, setStrictFiltering] = useState(false);
    const [separateSinners, setSeparateSinners] = useState(false);
    const [compareMode, setCompareMode] = useState("off");

    useEffect(() => {
        const savedDisplayType = localStorage.getItem("idEgoDisplayType");
        setDisplayType(savedDisplayType ?? "full");
        const savedStrictFiltering = localStorage.getItem("idEgoStrictFiltering");
        setStrictFiltering(savedStrictFiltering ? JSON.parse(savedStrictFiltering) : false);
        const savedSeparateSinners = localStorage.getItem("idEgoSeparateSinners");
        setSeparateSinners(savedSeparateSinners ? JSON.parse(savedSeparateSinners) : false);
    }, []);

    useEffect(() => {
        if (displayType) localStorage.setItem("idEgoDisplayType", displayType);
    }, [displayType]);

    const handleStrictFilteringToggle = (checked) => {
        localStorage.setItem("idEgoStrictFiltering", JSON.stringify(checked));
        setStrictFiltering(checked);
    }

    const handleSeparateSinnersToggle = (checked) => {
        localStorage.setItem("idEgoSeparateSinners", JSON.stringify(checked));
        setSeparateSinners(checked);
    }

    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [selectedSeasons, setSelectedSeasons] = useState([]);

    const [statusOptions, seasonOptions] = useMemo(() => {
        if (egosLoading) return [];
        const statusList = new Set();
        const seasonList = new Set();
        seasonList.add(9100);

        Object.entries(egos).forEach(([_id, ego]) => {
            (ego.keywordTags || ego.statuses).forEach(status => statusList.add(status))
            seasonList.add(ego.season);
        })

        return [[...statusList].map(id => ({
            value: id,
            label: <Status id={id} includeTooltip={false} />,
            name: statuses[id].name
        })).sort((a, b) => a.name.localeCompare(b.name)), [...seasonList].map(season => ({
            value: season,
            label: season === 9100 ? "Walpurgisnacht (any)" : getSeasonString(season),
            name: season === 9100 ? "Walpurgisnacht" : getSeasonString(season)
        })).sort((a, b) => a.value - b.value)]
    }, [egos, egosLoading]);

    return <div style={{ display: "flex", flexDirection: "column", maxHeight: "100%", width: "100%", gap: "1rem", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, auto)", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <span style={{ textAlign: 'end' }}>Search:</span>
                <input value={searchString} onChange={e => setSearchString(e.target.value)} placeholder={"E.G.O Name"} />
                <span style={{ textAlign: "end" }}>Filter Statuses:</span>
                <MultiSelector options={statusOptions} selected={selectedStatuses} setSelected={setSelectedStatuses} placeholder={"Select Statuses..."} />
                <span style={{ textAlign: "end" }}>Filter Season:</span>
                <MultiSelector options={seasonOptions} selected={selectedSeasons} setSelected={setSelectedSeasons} placeholder={"Select Seasons..."} />
                <span style={{ textAlign: "end" }}>Display Type:</span>
                <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    <label>
                        <input type="radio" name="displayType" value={"icon"} checked={displayType === "icon"} onChange={e => setDisplayType(e.target.value)} disabled={compareMode !== "off"} />
                        Icons Only
                    </label>
                    <label>
                        <input type="radio" name="displayType" value={"card"} checked={displayType === "card"} onChange={e => setDisplayType(e.target.value)} disabled={compareMode === "basic"} />
                        Cards
                    </label>
                    <label>
                        <input type="radio" name="displayType" value={"full"} checked={displayType === "full"} onChange={e => setDisplayType(e.target.value)} disabled={compareMode === "basic"} />
                        Full Details
                    </label>
                </div>
                <div />
                <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.2rem", flexWrap: "wrap" }}>
                        <input type="checkbox" checked={strictFiltering} onChange={e => handleStrictFilteringToggle(e.target.checked)} />
                        Strict Filtering
                        <span style={{ fontSize: "0.8rem", color: "#aaa" }}>(Require all selected filters)</span>
                    </label>
                </div>
                <div />
                <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                        <input type="checkbox" checked={separateSinners} onChange={e => handleSeparateSinnersToggle(e.target.checked)} />
                        Separate by Sinner
                    </label>
                </div>
                <div />
                <div>
                    <DropdownButton value={compareMode} setValue={setCompareMode} options={{ "off": "Compare Mode Disabled", "basic": "Basic Compare Mode", "adv": "Advanced Compare Mode" }} />
                </div>
            </div>
            <MainFilterSelector selectedMainFilters={selectedMainFilters} setSelectedMainFilters={setSelectedMainFilters} />
        </div>
        <div style={{ border: "1px #777 solid", width: "100%" }} />
        {egosLoading ? null :
            <EgoList
                egos={egos}
                searchString={searchString}
                selectedMainFilters={selectedMainFilters}
                displayType={displayType}
                separateSinners={separateSinners}
                strictFiltering={strictFiltering}
                selectedStatuses={selectedStatuses}
                selectedSeasons={selectedSeasons}
                compareMode={compareMode}
            />}
    </div>;
}
