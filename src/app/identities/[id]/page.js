"use client";

import React, { useEffect, useState } from "react";
import { Icon, IdentityImg, KeywordIcon, RarityImg, SinnerIcon, useData } from '@eldritchtools/limbus-shared-library';
import { ColorResist, getSeasonString, LEVEL_CAP, sinnerMapping } from "@/app/utils";
import { Tooltip } from "react-tooltip";
import { tabStyle, tooltipStyle } from "../../styles";
import SkillCard from "@/app/components/SkillCard";
import PassiveCard from "@/app/components/PassiveCard";
import UptieSelector from "@/app/components/UptieSelector";
import MarkdownRenderer from "@/app/components/Markdown/MarkdownRenderer";
import BuildEntry from "@/app/components/BuildEntry";
import { getFilteredBuilds } from "@/app/database/builds";
import NumberInputWithButtons from "@/app/components/NumberInputWithButtons";
import { constructHp, constructPassive } from "../IdentityUtils";
import { useBreakpoint } from "@eldritchtools/shared-components";

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
    return <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {builds.map(build => <BuildEntry key={build.id} build={build} size={"M"} complete={false} />)}
    </div>
}

export default function Identity({ params }) {
    const { id } = React.use(params);
    const [identities, identitiesLoading] = useData("identities");
    const [skillData, skillDataLoading] = useData(`identitiesv2/${id}`);
    const identityData = identitiesLoading ? null : identities[id];
    const [uptie, setUptie] = useState(4);
    const [level, setLevel] = useState(LEVEL_CAP);
    const [activeTab, setActiveTab] = useState("notes");
    const [builds, setBuilds] = useState(null);

    useEffect(() => {
        const fetchBuilds = async () => {
            setBuilds(await getFilteredBuilds({ "identities": [id] }, true, "score", false, 1, 6) || []);
        }

        if (activeTab === "builds" && !builds) fetchBuilds();
    }, [activeTab, builds, id])

    useEffect(() => {
        if (identityData) document.title = `${sinnerMapping[identityData.sinnerId]} ${identityData.name} | Limbus Company Team Building Hub`;
    }, [identityData])

    if (identitiesLoading || skillDataLoading) return null;

    const combatPassives = skillData.combatPassives.findLast(passives => passives.uptie <= uptie);
    const supportPassives = skillData.supportPassives.findLast(passives => passives.uptie <= uptie);

    return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "row", width: "100%", flexWrap: "wrap", justifyContent: "center", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", padding: "0.5rem", width: "min(480px, 100%)" }}>
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "0.5rem", width: "100%" }}>
                    <RarityImg rarity={identityData.rank} style={{ display: "inline", height: "2rem" }} />
                    <div style={{ display: "flex", flexDirection: "column", fontSize: "1.2rem", fontWeight: "bold", alignItems: "center", textAlign: "center" }}>
                        <span>{sinnerMapping[identityData.sinnerId]}</span>
                        <span>{identityData.name}</span>
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem", justifyContent: "center", padding: "0.5rem" }}>
                    <SinnerIcon num={identityData.sinnerId} style={{ height: "40px" }} />
                    Uptie: <UptieSelector value={uptie} setValue={setUptie} />
                    Level: <NumberInputWithButtons value={level} setValue={setLevel} min={1} max={LEVEL_CAP} />
                </div>
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
                    <IdentityImg identity={identityData} uptie={2} style={{ width: "50%", maxWidth: "192px", height: "auto" }} />
                    {identityData.tags.includes("Base Identity") ? null : <IdentityImg identity={identityData} uptie={4} style={{ width: "50%", maxWidth: "192px", height: "auto" }} />}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", border: "1px #777 dotted", padding: "0.2rem" }}>
                        <span>Release Date</span>
                        <span>{identityData.date}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", border: "1px #777 dotted", padding: "0.2rem" }}>
                        <span>Season</span>
                        <span>{getSeasonString(identityData.season)}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", alignItems: "center", border: "1px #777 dotted" }}>
                        <div style={{ display: "flex", justifyContent: "center" }}><Icon path={"hp"} style={{ height: "32px" }} /></div>
                        <span style={{ borderLeft: "1px #777 dotted" }}>{constructHp(identityData, level)}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", alignItems: "center", border: "1px #777 dotted" }}>
                        <div style={{ display: "flex", justifyContent: "center" }}><Icon path={"speed"} style={{ height: "32px" }} /></div>
                        <span style={{ borderLeft: "1px #777 dotted" }}>{identityData.speedList[uptie - 1].join(" - ")}</span>
                    </div>
                </div>
                <div style={{ border: "1px #777 dotted", padding: "0.2rem", textAlign: "center" }}>Resists</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", textAlign: "center" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", alignItems: "center", border: "1px #777 dotted" }}>
                        <div style={{ display: "flex", justifyContent: "center" }}><Icon path={"Slash"} style={{ height: "32px" }} /></div>
                        <span style={{ borderLeft: "1px #777 dotted" }}><ColorResist resist={identityData.resists.slash} /></span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", alignItems: "center", border: "1px #777 dotted" }}>
                        <div style={{ display: "flex", justifyContent: "center" }}><Icon path={"Pierce"} style={{ height: "32px" }} /></div>
                        <span style={{ borderLeft: "1px #777 dotted" }}><ColorResist resist={identityData.resists.pierce} /></span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", alignItems: "center", border: "1px #777 dotted" }}>
                        <div style={{ display: "flex", justifyContent: "center" }}><Icon path={"Blunt"} style={{ height: "32px" }} /></div>
                        <span style={{ borderLeft: "1px #777 dotted" }}><ColorResist resist={identityData.resists.blunt} /></span>
                    </div>
                </div>
                <div style={{ border: "1px #777 dotted", padding: "0.2rem", textAlign: "center", display: "flex", flexDirection: "column" }}>
                    <div style={{ borderBottom: "1px #777 dotted" }}>Keywords</div>
                    <div style={{ marginTop: "0.2rem" }}>{(identityData.skillKeywordList || []).map(x => <KeywordIcon key={x} id={x} />)}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", border: "1px #777 dotted", padding: "0.5rem", gap: "0.2rem" }}>
                    <div style={{ display: "flex", gap: "1rem", alignSelf: "center" }}>
                        <div data-tooltip-id="identity-notes" style={{ ...tabStyle, fontSize: "1rem", color: activeTab === "notes" ? "#ddd" : "#777" }} onClick={() => setActiveTab("notes")}>Notes/Explanation</div>
                        <div data-tooltip-id="identity-builds" style={{ ...tabStyle, fontSize: "1rem", color: activeTab === "builds" ? "#ddd" : "#777" }} onClick={() => setActiveTab("builds")}>Popular Builds</div>
                    </div>
                    <Tooltip id="identity-notes" style={{ ...tooltipStyle, maxWidth: "85%" }}>
                        <div>
                            This section is only meant to contain details about the identity&apos;s mechanics.
                            <br />
                            It will generally not contain things such as:
                            <ul>
                                <li>Meta analysis</li>
                                <li>Comparisons to other identities</li>
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
                <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "0.5rem" }}>
                    {[1, 2, 3, 4].map(tier => {
                        const list = identityData.skillTypes.filter(skill => skill.type.tier === tier);
                        if (list.length === 0) return null;
                        return <div key={tier} style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
                            {list.map((skill, index) => <div key={skill.id} style={{ flex: 1, minWidth: "min(300px, 100%)" }}>
                                <SkillCard skill={skillData.skills[skill.id]} uptie={uptie} count={skill.num} level={level} index={index} />
                            </div>)}
                        </div>
                    })}
                    <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
                        {identityData.defenseSkillTypes.map(skill => <div key={skill.id} style={{ flex: 1, minWidth: "min(300px, 100%)" }}>
                            <SkillCard key={skill.id} skill={skillData.skills[skill.id]} uptie={uptie} level={level} type={"defense"} />
                        </div>)}
                    </div>
                    {combatPassives ?
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ color: "#aaa", fontWeight: "bold", fontSize: "1.25rem" }}>Combat Passives</div>
                            <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
                                {combatPassives.passives.map((passive, i) => <div key={i} style={{ flex: 1, minWidth: "min(300px, 100%)" }}>
                                    <PassiveCard passive={constructPassive(passive, skillData.passiveData)} />
                                </div>)}
                            </div>
                        </div> :
                        null
                    }
                    {supportPassives ?
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ color: "#aaa", fontWeight: "bold", fontSize: "1.25rem" }}>Support Passives</div>
                            <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", minWidth: "min(300px, 100%)" }}>
                                {supportPassives.passives.map((passive, i) => <div key={i} style={{ flex: 1 }}><PassiveCard passive={skillData.passiveData[passive]} /></div>)}
                            </div>
                        </div> :
                        null
                    }
                </div>

            </div>
        </div>
    </div>
}
