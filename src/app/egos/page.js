"use client";

import { useMemo, useState } from "react";
import { Icon, EgoImg, RarityImg, SinnerIcon, Status, statuses, useData } from "@eldritchtools/limbus-shared-library";
import { capitalizeFirstLetter, ColorResist, sinnerMapping } from "../utils";
import { selectStyle } from "../styles";
import dynamic from "next/dynamic";
import Link from "next/link";
import "./egos.css";
const Select = dynamic(() => import("react-select"), { ssr: false });

export const metadata = {
    title: "E.G.Os",
    description: "Browse information on E.G.Os"
};

const mainFilters = {
    "tier": ["zayin", "teth", "he", "waw", "aleph"],
    "affinity": ["wrath", "lust", "sloth", "gluttony", "gloom", "pride", "envy"],
    "skillType": ["Slash", "Pierce", "Blunt"],
    "keyword": ["Burn", "Bleed", "Tremor", "Rupture", "Sinking", "Poise", "Charge"]
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
        {wrapCell(<div style={{ display: "grid", gridTemplateColumns: "repeat(7, 64px)" }}>
            {mainFilters.affinity.map(affinity => <div key={affinity} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "0.25rem" }}>
                <Icon path={affinity} style={{ height: "32px", width: "32px" }} />
                <span>{affinity in ego.cost ? ego.cost[affinity] : <span style={{ color: "#777" }}>0</span>}</span>
                <span>{<ColorResist resist={ego.resists[affinity]} />}</span>
            </div>)}
        </div>)}
        {wrapCell(<div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", maxWidth: "75ch", padding: "0.5rem", gap: "0.5rem" }}>
            {ego.keywordTags.sort().map(keyword => <Status key={keyword} id={keyword} style={{ height: "32px" }} />)}
        </div>)}
    </tr>
}

function EgoCard({ ego }) {
    return <div className="clickable-ego-card" style={{ display: "flex", flexDirection: "row", padding: "0.5rem", width: "420px", height: "280px", border: "1px #777 solid", borderRadius: "0.25rem", boxSizing: "border-box" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
            <EgoImg ego={ego} type={"awaken"} scale={0.5} />
            {"corrosionType" in ego ? <EgoImg ego={ego} type={"erosion"} scale={0.5} /> : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "0.5rem", alignItems: "center", textAlign: "center" }}>
            <RarityImg rarity={ego.rank.toLowerCase()} style={{ height: "32px" }} />
            {ego.name}
            <div style={{ display: "flex", gap: "2rem" }}>
                <SkillTypeIcons skill={ego.awakeningType} />
                {"corrosionType" in ego ? <SkillTypeIcons skill={ego.corrosionType} /> : null}
            </div>
            Cost
            <div style={{ display: "flex", gap: "0.25rem" }}>
                {Object.entries(ego.cost).map(([affinity, cost]) => <div key={affinity} style={{ display: "flex", flexDirection: "column" }}>
                    <Icon path={affinity} style={{ height: "32px", width: "32px" }} />
                    <span>{affinity in ego.cost ? ego.cost[affinity] : <span style={{ color: "#777" }}>0</span>}</span>
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

function EgoList({ egos, searchString, selectedMainFilters, displayType, separateSinners, selectedKeywords }) {
    const filters = useMemo(() => selectedMainFilters.reduce((acc, filter) => {
        if (mainFiltersMapping[filter] in acc) acc[mainFiltersMapping[filter]].push(filter);
        else acc[mainFiltersMapping[filter]] = [filter];
        return acc;
    }, {}), [selectedMainFilters])

    const list = useMemo(() => Object.entries(egos).filter(([_id, ego]) => {
        if (searchString !== "" && !checkSearchMatch(searchString, ego)) return false;

        for (const type in filters) {
            if (type === "tier") {
                if (!filters[type].some(x => x === ego.rank.toLowerCase())) return false;
            } else if (type === "affinity") {
                if (!filters[type].some(x => ego.awakeningType.affinity === x || ("corrosionType" in ego && ego.corrosionType.affinity === x))) return false;
            } else if (type === "skillType") {
                if (!filters[type].some(x => ego.awakeningType.type === x.toLowerCase() || ("corrosionType" in ego && ego.corrosionType.type === x.toLowerCase()))) return false;
            } else if (type === "keyword") {
                if (!filters[type].some(x => ego.keywordTags.includes(keywordMapping[x]))) return false;
            }
        }

        if (selectedKeywords.length !== 0) {
            if (!selectedKeywords.some(keywordOption => ego.keywordTags.includes(keywordOption.value))) return false;
        }

        return true;
    }), [searchString, filters, egos, selectedKeywords]);

    const splitBySinner = list => list.reduce((acc, [id, ego]) => {
        if (ego.sinnerId in acc) acc[ego.sinnerId].push([id, ego]);
        else acc[ego.sinnerId] = [[id, ego]];
        return acc;
    }, {})

    if (displayType === "icon") {
        const listToComponents = list => <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))", width: "100%", overflowY: "auto", gap: "0.5rem" }}>
            {list.map(([id, ego]) => <div key={id}><Link href={`/egos/${id}`} style={{ color: "#ddd", textDecoration: "none" }}>
                <div className="clickable-ego"><EgoImg key={id} ego={ego} type={"awaken"} displayName={true} scale={0.5} /></div>
            </Link></div>)}
        </div>

        if (separateSinners) {
            return <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                {Object.entries(splitBySinner(list)).map(([sinnerId, list]) => [
                    <div key={sinnerId} style={{ display: "flex", flexDirection: "row", alignItems: "center", fontSize: "1.2rem", fontWeight: "bold" }}>
                        <SinnerIcon num={sinnerId} style={{ height: "48px" }} />
                        {sinnerMapping[sinnerId]}
                    </div>,
                    listToComponents(list)
                ]).flat()}
            </div>
        } else {
            return listToComponents(list);
        }
    } else if (displayType === "card") {
        const listToComponents = list => <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 420px)", width: "100%", overflowY: "auto", gap: "0.5rem", justifyContent: "center" }}>
            {list.map(([id, ego]) => <div key={id}><Link href={`/egos/${id}`} style={{ color: "#ddd", textDecoration: "none" }}><EgoCard key={id} ego={ego} /></Link></div>)}
        </div>

        if (separateSinners) {
            return <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                {Object.entries(splitBySinner(list)).map(([sinnerId, list]) => [
                    <div key={sinnerId} style={{ display: "flex", flexDirection: "row", alignItems: "center", fontSize: "1.2rem", fontWeight: "bold" }}>
                        <SinnerIcon num={sinnerId} style={{ height: "48px" }} />
                        {sinnerMapping[sinnerId]}
                    </div>,
                    listToComponents(list)
                ]).flat()}
            </div>
        } else {
            return listToComponents(list);
        }
    } else {
        return <table style={{ borderCollapse: "collapse", width: "100%" }}>
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
            alignItems: "center", justifyContent: "center", padding: "0.1rem 0.2rem", cursor: "pointer"
        }}
            onClick={() => handleToggle(filter, selected)}
        >
            <Icon path={filter} style={{ height: "32px" }} />
        </div>
    }

    return <div style={{ display: "flex", flexWrap: "wrap", border: "1px #777 dotted", borderRadius: "1rem", minWidth: "200px", padding: "0.5rem" }}>
        {Object.entries(mainFilters).reduce((acc, [_, list]) => [...acc, list.map(filter => toggleComponent(filter, selectedMainFilters.includes(filter)))], [])}
        {<div style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={clearAll}>Clear All</div>}
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

export default function Egos() {
    const [egos, egosLoading] = useData("egos");

    const [searchString, setSearchString] = useState("");
    const [selectedMainFilters, setSelectedMainFilters] = useState([]);
    const [displayType, setDisplayType] = useState("full");
    const [separateSinners, setSeparateSinners] = useState(false);
    const [selectedKeywords, setSelectedKeywords] = useState([]);

    const keywordOptions = useMemo(() => {
        if (egosLoading) return [];
        const keywordList = new Set();

        Object.entries(egos).forEach(([_id, ego]) => {
            ego.keywordTags.forEach(keyword => keywordList.add(keyword))
        })

        return [...keywordList].map(id => ({
            value: id,
            label: <Status id={id} includeTooltip={false} />,
            name: statuses[id].name
        })).sort((a, b) => a.name.localeCompare(b.name))
    }, [egos, egosLoading]);

    return <div style={{ display: "flex", flexDirection: "column", maxHeight: "100%", width: "100%", gap: "1rem", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "row", gap: "2rem", flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, auto)", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}>
                    <span style={{ textAlign: 'end' }}>Search:</span>
                    <input value={searchString} onChange={e => setSearchString(e.target.value)} />
                    <span style={{ textAlign: "end" }}>Display Type:</span>
                    <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center" }}>
                        <label>
                            <input type="radio" name="displayType" value={"icon"} checked={displayType === "icon"} onChange={e => setDisplayType(e.target.value)} />
                            Icons Only
                        </label>
                        <label>
                            <input type="radio" name="displayType" value={"card"} checked={displayType === "card"} onChange={e => setDisplayType(e.target.value)} />
                            Cards
                        </label>
                        <label>
                            <input type="radio" name="displayType" value={"full"} checked={displayType === "full"} onChange={e => setDisplayType(e.target.value)} />
                            Full Details
                        </label>
                    </div>
                    <div>
                    </div>
                </div>
            </div>
            <MainFilterSelector selectedMainFilters={selectedMainFilters} setSelectedMainFilters={setSelectedMainFilters} />
        </div>
        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: "1rem" }}>
            <label>
                <input type="checkbox" checked={separateSinners} onChange={e => setSeparateSinners(e.target.checked)} />
                Separate Sinners
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                Filter Statuses:
                <MultiSelector options={keywordOptions} selected={selectedKeywords} setSelected={setSelectedKeywords} placeholder={"Select Statuses..."} />
            </div>
        </div>
        {egosLoading ? null :
            <EgoList
                egos={egos}
                searchString={searchString}
                selectedMainFilters={selectedMainFilters}
                displayType={displayType}
                separateSinners={separateSinners}
                selectedKeywords={selectedKeywords}
            />}
    </div>;
}
