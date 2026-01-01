"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon, IdentityImg, RarityImg, SinnerIcon, Status, useData } from "@eldritchtools/limbus-shared-library";
import { capitalizeFirstLetter, getSeasonString, sinnerMapping } from "../utils";
import { selectStyle } from "../styles";
import Link from "next/link";
import "./identities.css";

import dynamic from "next/dynamic";
import IdentityComparisonAdvanced from "./IdentityComparisonAdvanced";
import DropdownButton from "../components/DropdownButton";
import IdentityComparisonBasic from "./IdentityComparisonBasic";
const Select = dynamic(() => import("react-select"), { ssr: false });

const mainFilters = {
    "tier": ["0", "00", "000"],
    "sinner": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    "keyword": ["Burn", "Bleed", "Tremor", "Rupture", "Sinking", "Poise", "Charge"],
    "affinity": ["wrath", "lust", "sloth", "gluttony", "gloom", "pride", "envy"],
    "skillType": ["Slash", "Pierce", "Blunt", "Guard", "Evade", "Counter"]
}

const mainFiltersMapping = Object.entries(mainFilters).reduce((acc, [type, list]) => list.reduce((acc2, filter) => { acc2[filter] = type; return acc2 }, acc), {});

function SkillSpread({ identity, columns = 4 }) {
    return <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: "0.5rem", rowGap: "1rem", width: "100%", placeItems: "center" }}>
        {identity.skillTypes.map(skill => {
            return <div key={skill.id} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.2rem", width: "64px" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <Icon path={skill.type.affinity} style={{ height: "32px" }} />
                    <Icon path={capitalizeFirstLetter(skill.type.type)} style={{ height: "32px" }} />
                </div>
                <span>x{skill.num}</span>
            </div>
        })}
        {identity.defenseSkillTypes.map(skill => {
            return <div key={skill.id} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.2rem", width: "64px" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <Icon path={skill.type.affinity} style={{ height: "32px" }} />
                    <Icon path={capitalizeFirstLetter(skill.type.type)} style={{ height: "32px" }} />
                </div>
                {skill.type.type === "counter" ? <Icon path={capitalizeFirstLetter(skill.type.atkType)} style={{ height: "32px" }} /> : null}
            </div>
        })}
    </div>
}

function processTag(tag, removeStyles = false) {
    if (tag.includes("<color=#d40000><s>")) {
        const text = tag.slice(18, 28)
        if (removeStyles) return text;
        else return <span style={{ color: "#d40000", textDecoration: "line-through" }}>{text}</span>
    } else {
        return tag;
    }
}

function IdentityDetails({ id, identity }) {
    const wrapCell = contents => <td style={{ borderTop: "1px #777 solid", borderBottom: "1px #777 solid", verticalAlign: "middle" }}>
        <Link key={id} href={`/identities/${id}`} style={{ color: "#ddd", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "128px" }}>
            {contents}
        </Link>
    </td>

    return <tr className="clickable-table-row">
        {wrapCell(<div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0.5rem" }}>
            <RarityImg rarity={identity.rank} style={{ height: "48px" }} />
        </div>)}
        {wrapCell(<div style={{ display: "flex", justifyContent: "center", padding: "0.1rem" }}>
            <IdentityImg identity={identity} uptie={2} scale={0.5} />
            {identity.tags.includes("Base Identity") ? null : <IdentityImg identity={identity} uptie={4} scale={0.5} />}
        </div>)}
        {wrapCell(<div style={{ textAlign: "center", gap: "0.2rem" }}>
            {identity.name}<br />{sinnerMapping[identity.sinnerId]}
        </div>)}
        {wrapCell(<SkillSpread identity={identity} />)}
        {wrapCell(<div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", padding: "0.5rem" }}>
            {(identity.skillKeywordList || []).map(keyword => <Icon key={keyword} path={keyword} style={{ height: "32px" }} />)}
        </div>)}
        {wrapCell(<div style={{ display: "flex", flexDirection: "column", textAlign: "center", gap: "0.2rem" }}>
            {identity.tags.map(tag => <div key={tag}>{processTag(tag)}</div>)}
        </div>)}
    </tr>
}

function IdentityCard({ identity }) {
    return <div className="clickable-id-card" style={{ display: "flex", flexDirection: "row", padding: "0.5rem", width: "min(420px, 100%)", height: "280px", border: "1px #777 solid", borderRadius: "0.25rem", boxSizing: "border-box" }}>
        <div style={{ display: "flex", flexDirection: "column", width: "128px" }}>
            <IdentityImg identity={identity} uptie={2} displayName={false} displayRarity={true} />
            {identity.tags.includes("Base Identity") ? null : <IdentityImg identity={identity} uptie={4} displayName={false} displayRarity={false} />}
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "0.5rem", alignItems: "center", textAlign: "center" }}>
            {identity.name}
            <SkillSpread identity={identity} columns={3} />
        </div>
    </div>
}

function includesIgnoreCase(s1, s2) {
    return s1.toLowerCase().includes(s2.toLowerCase());
}

function checkSearchMatch(searchString, identity) {
    if (includesIgnoreCase(identity.name, searchString)) return true;
    return false;
}

function IdentityList({ identities, searchString, selectedMainFilters, displayType, separateSinners, strictFiltering, selectedStatuses, selectedFactionTags, selectedSeasons, compareMode }) {
    const filters = useMemo(() => selectedMainFilters.reduce((acc, filter) => {
        if (mainFiltersMapping[filter] in acc) acc[mainFiltersMapping[filter]].push(filter);
        else acc[mainFiltersMapping[filter]] = [filter];
        return acc;
    }, {}), [selectedMainFilters])

    const list = useMemo(() => Object.entries(identities).filter(([_id, identity]) => {
        if (searchString !== "" && !checkSearchMatch(searchString, identity)) return false;

        for (const type in filters) {
            if (type === "tier") {
                if (strictFiltering) {
                    if (!filters[type].every(x => x.length === identity.rank)) return false;
                } else {
                    if (!filters[type].some(x => x.length === identity.rank)) return false;
                }
            } else if (type === "affinity") {
                if (strictFiltering) {
                    if (!filters[type].every(x => identity.skillTypes.some(s => s.type.affinity === x) || identity.defenseSkillTypes.some(s => s.type.affinity === x))) return false;
                } else {
                    if (!filters[type].some(x => identity.skillTypes.some(s => s.type.affinity === x) || identity.defenseSkillTypes.some(s => s.type.affinity === x))) return false;
                }
            } else if (type === "skillType") {
                if (strictFiltering) {
                    if (!filters[type].every(x => identity.skillTypes.some(s => s.type.type === x.toLowerCase()) || identity.defenseSkillTypes.some(s => s.type.type === x.toLowerCase()))) return false;
                } else {
                    if (!filters[type].some(x => identity.skillTypes.some(s => s.type.type === x.toLowerCase()) || identity.defenseSkillTypes.some(s => s.type.type === x.toLowerCase()))) return false;
                }
            } else if (type === "keyword") {
                if (strictFiltering) {
                    if (!filters[type].every(x => (identity.skillKeywordList || []).includes(x))) return false;
                } else {
                    if (!filters[type].some(x => (identity.skillKeywordList || []).includes(x))) return false;
                }
            } else if (type === "sinner") {
                if (strictFiltering) {
                    if (!filters[type].every(x => x === identity.sinnerId)) return false;
                } else {
                    if (!filters[type].some(x => x === identity.sinnerId)) return false;
                }
            }
        }

        if (selectedStatuses.length !== 0) {
            if (strictFiltering) {
                if (!selectedStatuses.every(statusOption => identity.statuses.includes(statusOption.value))) return false;
            } else {
                if (!selectedStatuses.some(statusOption => identity.statuses.includes(statusOption.value))) return false;
            }
        }

        if (selectedFactionTags.length !== 0) {
            if (strictFiltering) {
                if (!selectedFactionTags.every(tagOption => identity.tags.includes(tagOption.value))) return false;
            } else {
                if (!selectedFactionTags.some(tagOption => identity.tags.includes(tagOption.value))) return false;
            }
        }

        if (selectedSeasons.length !== 0) {
            if (strictFiltering) {
                if (!selectedSeasons.every(season => season.value === identity.season || (season.value === 9100 && identity.season > 9100))) return false;
            } else {
                if (!selectedSeasons.some(season => season.value === identity.season || (season.value === 9100 && identity.season > 9100))) return false;
            }
        }

        return true;
    }), [searchString, filters, identities, selectedStatuses, selectedFactionTags, selectedSeasons, strictFiltering]);

    if (compareMode === "basic") {
        return <IdentityComparisonBasic />
    }

    if (compareMode === "adv") {
        return <IdentityComparisonAdvanced
            identities={list}
            displayType={displayType}
            separateSinners={separateSinners}
        />
    }

    const splitBySinner = list => list.reduce((acc, [id, identity]) => {
        if (identity.sinnerId in acc) acc[identity.sinnerId].push([id, identity]);
        else acc[identity.sinnerId] = [[id, identity]];
        return acc;
    }, {})

    if (displayType === "icon") {
        const listToComponents = list => <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))", width: "100%", gap: "0.5rem" }}>
            {list.map(([id, identity]) => <div key={id}><Link href={`/identities/${id}`} style={{ color: "#ddd", textDecoration: "none" }}>
                <div className="clickable-id">
                    <IdentityImg identity={identity} uptie={4} displayName={true} displayRarity={true} />
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
            {list.map(([id, identity]) => <div key={id}><Link href={`/identities/${id}`} style={{ color: "#ddd", textDecoration: "none" }}><IdentityCard key={id} identity={identity} /></Link></div>)}
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
                        <th>Skills</th>
                        <th>Keywords</th>
                        <th>Factions/Tags</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        separateSinners ?
                            Object.entries(splitBySinner(list)).map(([sinnerId, list]) => [
                                <tr key={sinnerId}><td colSpan={6} style={{ borderTop: "1px #777 solid", borderBottom: "1px #777 solid" }}>
                                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", fontSize: "1.2rem", fontWeight: "bold", }}>
                                        <SinnerIcon num={sinnerId} style={{ height: "48px" }} />
                                        {sinnerMapping[sinnerId]}
                                    </div>
                                </td></tr>,
                                list.map(([id, identity]) => <IdentityDetails key={id} id={id} identity={identity} />)
                            ]).flat() :
                            list.map(([id, identity]) => <IdentityDetails key={id} id={id} identity={identity} />)
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
                if (category === "sinner") {
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

export default function Identities() {
    const [identities, identitiesLoading] = useData("identities");
    const [statuses, statusesLoading] = useData("statuses");

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
    const [selectedFactionTags, setSelectedFactionTags] = useState([]);
    const [selectedSeasons, setSelectedSeasons] = useState([]);

    const [statusOptions, tagOptions, seasonOptions] = useMemo(() => {
        if (identitiesLoading || statusesLoading) return [];
        const statusList = new Set();
        const tagList = new Set();
        const seasonList = new Set();
        seasonList.add(9100);

        Object.entries(identities).forEach(([_id, identity]) => {
            identity.statuses.forEach(status => statusList.add(status));
            identity.tags.forEach(tag => tagList.add(tag));
            seasonList.add(identity.season);
        });

        return [[...statusList].map(id => ({
            value: id,
            label: <Status status={statuses[id]} includeTooltip={false} />,
            name: statuses[id].name
        })).sort((a, b) => a.name.localeCompare(b.name)), [...tagList].map(tag => ({
            value: tag,
            label: processTag(tag),
            name: processTag(tag, true)
        })).sort((a, b) => a.name.localeCompare(b.name)), [...seasonList].map(season => ({
            value: season,
            label: season === 9100 ? "Walpurgisnacht (any)" : getSeasonString(season),
            name: season === 9100 ? "Walpurgisnacht" : getSeasonString(season)
        })).sort((a, b) => a.value - b.value)]
    }, [identities, identitiesLoading, statuses, statusesLoading]);

    return <div style={{ display: "flex", flexDirection: "column", maxHeight: "100%", width: "100%", gap: "1rem", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, auto)", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <span style={{ textAlign: 'end' }}>Search:</span>
                <input value={searchString} onChange={e => setSearchString(e.target.value)} placeholder="Identity Name" />
                <span style={{ textAlign: "end" }}>Filter Statuses:</span>
                <MultiSelector options={statusOptions} selected={selectedStatuses} setSelected={setSelectedStatuses} placeholder={"Select Statuses..."} />
                <span style={{ textAlign: "end" }}>Filter Factions:</span>
                <MultiSelector options={tagOptions} selected={selectedFactionTags} setSelected={setSelectedFactionTags} placeholder={"Select Factions/Tags..."} />
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
        {identitiesLoading ? null :
            <IdentityList
                identities={identities}
                searchString={searchString}
                selectedMainFilters={selectedMainFilters}
                displayType={displayType}
                separateSinners={separateSinners}
                strictFiltering={strictFiltering}
                selectedStatuses={selectedStatuses}
                selectedFactionTags={selectedFactionTags}
                selectedSeasons={selectedSeasons}
                compareMode={compareMode}
            />
        }
    </div>;
}
