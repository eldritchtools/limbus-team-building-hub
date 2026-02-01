"use client";

import React, { useEffect, useState } from "react";
import { Icon, EgoImg, RarityImg, useData, SinnerIcon } from '@eldritchtools/limbus-shared-library';
import { ColorResist, getSeasonString, sinnerMapping } from "@/app/utils";
import { Tooltip } from "react-tooltip";
import { tabStyle, tooltipStyle } from "../../styles";
import SkillCard from "@/app/components/SkillCard";
import PassiveCard from "@/app/components/PassiveCard";
import UptieSelector from "@/app/components/UptieSelector";
import MarkdownRenderer from "@/app/components/Markdown/MarkdownRenderer";
import BuildEntry from "@/app/components/BuildEntry";
import { getFilteredBuilds } from "@/app/database/builds";

const affinities = ["wrath", "lust", "sloth", "gluttony", "gloom", "pride", "envy"];

function NotesTab({ notes }) {
    if (!notes || !notes.main) return <div style={{ color: "#777", textAlign: "center" }}>Not yet available...</div>;
    if (!notes.other)
        return <div style={{ display: "flex", flexDirection: "column" }}>
            {notes.main.map((str, i) => <div key={i} style={{ display: "flex", flexDirection: "row", gap: "0.25rem", lineHeight: "1.4" }}>
                • <MarkdownRenderer content={str} />
            </div>)}
        </div>

    return <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ color: "#aaa", fontSize: "0.8rem" }}>Main</div>
        {notes.main.map((str, i) => <div key={i} style={{ display: "flex", flexDirection: "row", gap: "0.25rem", lineHeight: "1.4" }}>
            • <MarkdownRenderer content={str} />
        </div>)}
        <div style={{ height: "0.5rem" }} />
        <div style={{ color: "#aaa", fontSize: "0.8rem" }}>Other</div>
        {notes.other.map((str, i) => <div key={i} style={{ display: "flex", flexDirection: "row", gap: "0.25rem", lineHeight: "1.4" }}>
            • <MarkdownRenderer content={str} />
        </div>)}
    </div>
}

function BuildsTab({ builds }) {
    if (!builds) return <div style={{ color: "#777", textAlign: "center" }}>Loading builds...</div>;
    if (builds.length === 0) return <div style={{ color: "#777", textAlign: "center" }}>No builds found.</div>;
    return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginLeft: "14px" }}>
        {builds.map(build => <BuildEntry key={build.id} build={build} size={"M"} complete={false} />)}
    </div>
}

export default function EgoPage({ params }) {
    const { id } = React.use(params);
    const [egos, egosLoading] = useData("egos");
    const [skillData, skillDataLoading] = useData(`egos/${id}`);
    const egoData = egosLoading ? null : egos[id];
    const [uptie, setUptie] = useState(4);
    const [activeTab, setActiveTab] = useState("notes");
    const [builds, setBuilds] = useState(null);
    const [compareMode, setCompareMode] = useState(false);
    const [preuptie, setPreuptie] = useState(1);

    useEffect(() => {
        const fetchBuilds = async () => {
            setBuilds(await getFilteredBuilds({ "egos": [id] }, true, "score", false, 1, 6) || []);
        }

        if (activeTab === "builds" && !builds) fetchBuilds();
    }, [activeTab, builds, id])

    useEffect(() => {
        if (egoData) document.title = `${sinnerMapping[egoData.sinnerId]} ${egoData.name} | Limbus Company Team Building Hub`;
    }, [egoData])

    if (egosLoading || skillDataLoading) return null;

    const handleSetUptie = (v) => {
        if (v === "compare mode") setCompareMode(true);
        else {
            setUptie(v);
            if (v < preuptie) setPreuptie(v);
        }
    }

    const handleSetPreuptie = (v) => {
        setPreuptie(v);
        if (v > uptie) setUptie(v);
    }

    const passives = skillData.passiveList;

    return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "row", width: "100%", flexWrap: "wrap", justifyContent: "center", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", padding: "0.5rem", width: "min(480px, 100%)" }}>
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "0.5rem", width: "100%" }}>
                    <RarityImg rarity={egoData.rank.toLowerCase()} style={{ display: "inline", height: "2rem" }} />
                    <div style={{ display: "flex", flexDirection: "column", fontSize: "1.2rem", fontWeight: "bold", alignItems: "center" }}>
                        <span>{sinnerMapping[egoData.sinnerId]}</span>
                        <span>{egoData.name}</span>
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem", justifyContent: "center", padding: "0.5rem" }}>
                    <SinnerIcon num={egoData.sinnerId} style={{ height: "40px" }} />
                    Threadspin: {compareMode ?
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <UptieSelector value={preuptie} setValue={handleSetPreuptie} />
                            ➔
                            <UptieSelector value={uptie} setValue={handleSetUptie} />
                        </div> :
                        <UptieSelector value={uptie} setValue={handleSetUptie} bottomOption={"compare mode"} />
                    }
                </div>
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
                    <EgoImg ego={egoData} type={"awaken"} style={{ width: "50%", maxWidth: "192px", height: "auto" }} />
                    {"corrosionType" in egoData ? <EgoImg ego={egoData} type={"erosion"} style={{ width: "50%", maxWidth: "192px", height: "auto" }} /> : null}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", border: "1px #777 dotted", padding: "0.2rem" }}>
                        <span>Release Date</span>
                        <span>{egoData.date}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", border: "1px #777 dotted", padding: "0.2rem" }}>
                        <span>Season</span>
                        <span>{getSeasonString(egoData.season)}</span>
                    </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", alignItems: "center", textAlign: "center", lineHeight: "1.5" }}>
                    <div style={{ height: "100%", borderLeft: "1px #777 dotted", borderBottom: "1px #777 dotted" }}></div>
                    <div style={{ height: "100%", borderBottom: "1px #777 dotted" }}>Cost</div>
                    <div style={{ height: "100%", borderRight: "1px #777 dotted", borderBottom: "1px #777 dotted" }}>Resist</div>
                    {affinities.map(affinity => [
                        <div key={`${affinity}-icon`} style={{ display: "flex", height: "100%", justifyContent: "center", borderLeft: "1px #777 dotted", borderBottom: "1px #777 dotted" }}>
                            <Icon path={affinity} style={{ height: "32px", width: "32px" }} />
                        </div>,
                        <span key={`${affinity}-cost`} style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", borderBottom: "1px #777 dotted" }}>
                            {affinity in egoData.cost ? egoData.cost[affinity] : <span style={{ color: "#777" }}>0</span>}
                        </span>,
                        <span key={`${affinity}-res`} style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", borderRight: "1px #777 dotted", borderBottom: "1px #777 dotted" }}>
                            {<ColorResist resist={egoData.resists[affinity]} />}
                        </span>
                    ])}
                </div>
                <div style={{ display: "flex", flexDirection: "column", border: "1px #777 dotted", padding: "0.5rem", gap: "0.2rem" }}>
                    <div style={{ display: "flex", gap: "1rem", alignSelf: "center" }}>
                        <div data-tooltip-id="ego-notes" style={{ ...tabStyle, fontSize: "1rem", color: activeTab === "notes" ? "#ddd" : "#777" }} onClick={() => setActiveTab("notes")}>Notes/Explanation</div>
                        <div data-tooltip-id="ego-builds" style={{ ...tabStyle, fontSize: "1rem", color: activeTab === "builds" ? "#ddd" : "#777" }} onClick={() => setActiveTab("builds")}>Popular Builds</div>
                    </div>
                    <Tooltip id="ego-notes" style={{ ...tooltipStyle, maxWidth: "85%" }}>
                        <div>
                            This section is only meant to contain details about the E.G.O&apos;s mechanics.
                            <br />
                            It will generally not contain things such as:
                            <ul>
                                <li>Meta analysis</li>
                                <li>Comparisons to other E.G.Os</li>
                                <li>Rankings</li>
                                <li>Combos with other identities/E.G.Os (unless explicitly stated in their respective kits)</li>
                                <li>Hyper optimizations and special use cases</li>
                                <li>And so on...</li>
                            </ul>
                        </div>
                    </Tooltip>
                    <Tooltip id="identity-builds" style={{ ...tooltipStyle, maxWidth: "85%" }}>
                        <div>Loads the most popular builds that use this identity.</div>
                    </Tooltip>
                    {
                        activeTab === "notes" ?
                            <NotesTab notes={skillData.notes} /> :
                            <BuildsTab builds={builds} />
                    }
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: "min(480px, 100%)", flex: 1, gap: "0.5rem" }}>
                <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
                    {skillData.awakeningSkills.map((skill, i) => <div key={i} style={{ flex: 1, minWidth: "min(300px, 100%)" }}>
                        <SkillCard skill={skill} uptie={uptie} type={"awakening"} preuptie={compareMode ? preuptie : null} />
                    </div>)}
                </div>
                {"corrosionSkills" in skillData ?
                    <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
                        {skillData.corrosionSkills.map((skill, i) => <div key={i} style={{ flex: 1, minWidth: "min(300px, 100%)" }}>
                            <SkillCard skill={skill} uptie={uptie} type={"corrosion"} preuptie={compareMode ? preuptie : null} />
                        </div>)}
                    </div> : null}
                {uptie >= 2 && passives ?
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ color: "#aaa", fontWeight: "bold", fontSize: "1.25rem" }}>Passives</div>
                        {passives.map((passive, i) => {
                            if (compareMode && preuptie < 2)
                                return <PassiveCard key={i} passive={passive} background={"rgba(46, 160, 67, 0.35)"} />
                            return <PassiveCard key={i} passive={passive} />
                        })}
                    </div> :
                    null
                }
            </div>
        </div>
    </div>
}
