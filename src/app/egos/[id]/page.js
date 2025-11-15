"use client";

import React, { useState } from "react";
import { Icon, EgoImg, RarityImg, useData, SinnerIcon } from '@eldritchtools/limbus-shared-library';
import { ColorResist, getSeasonString, sinnerMapping } from "@/app/utils";
import { Tooltip } from "react-tooltip";
import { tooltipStyle } from "../../styles";
import SkillCard from "@/app/components/SkillCard";
import PassiveCard from "@/app/components/PassiveCard";
import UptieSelector from "@/app/components/UptieSelector";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";

const affinities = ["wrath", "lust", "sloth", "gluttony", "gloom", "pride", "envy"];

export default function EgoPage({ params }) {
    const { id } = React.use(params);
    const [egos, egosLoading] = useData("egos");
    const [skillData, skillDataLoading] = useData(`egos/${id}`);
    const egoData = egosLoading ? null : egos[id];
    const [uptie, setUptie] = useState(4);

    const passives = skillDataLoading ? null : skillData.passiveList;

    if (egosLoading || skillDataLoading) return null;

    return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", padding: "1rem", width: "384px" }}>
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "0.5rem", width: "100%" }}>
                    <RarityImg rarity={egoData.rank.toLowerCase()} style={{ display: "inline", height: "2rem" }} />
                    <div style={{ display: "flex", flexDirection: "column", fontSize: "1.2rem", fontWeight: "bold", alignItems: "center" }}>
                        <span>{sinnerMapping[egoData.sinnerId]}</span>
                        <span>{egoData.name}</span>
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem", justifyContent: "center", padding: "0.5rem" }}>
                    <SinnerIcon num={egoData.sinnerId} style={{ height: "40px" }} />
                    Threadspin: <UptieSelector value={uptie} setValue={setUptie} />
                </div>
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
                    <EgoImg ego={egoData} type={"awaken"} scale={0.75} />
                    {"corrosionType" in egoData ? <EgoImg ego={egoData} type={"erosion"} scale={0.75} /> : null}
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
                <div style={{ display: "flex", flexDirection: "column", border: "1px #777 dotted", padding: "0.2rem", gap: "0.2rem" }}>
                    <div data-tooltip-id="ego-notes" style={{ alignSelf: "center", textAlign: "center", borderBottom: "1px #aaa dotted" }}>
                        Notes, Comments, Explanation
                    </div>
                    <Tooltip id="ego-notes" style={tooltipStyle}>
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
                    <div style={{ color: "#aaa", fontSize: "0.8rem" }}>
                        Short
                    </div>
                    {egoData.notes && egoData.notes.short ?
                        <MarkdownRenderer content={egoData.notes.short} /> :
                        <div style={{ color: "#777", textAlign: "center" }}>Not yet available...</div>}
                    <div style={{ color: "#aaa", fontSize: "0.8rem" }}>
                        Full
                    </div>
                    {egoData.notes && egoData.notes.full ?
                        <MarkdownRenderer content={egoData.notes.full} /> :
                        <div style={{ color: "#777", textAlign: "center" }}>Not yet available...</div>}
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "0.5rem" }}>
                <div style={{ display: "flex" }}>
                    <SkillCard skill={skillData.awakeningSkill} uptie={uptie} type={"awakening"} />
                </div>
                {"corrosionSkill" in skillData ? <div style={{ display: "flex" }}><SkillCard skill={skillData.corrosionSkill} uptie={uptie} type={"corrosion"} /></div> : null}
                {uptie >= 2 && passives ?
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ color: "#aaa", fontWeight: "bold", fontSize: "1.25rem" }}>Passives</div>
                        {passives.map(passive => <PassiveCard key={passive} passive={passive} />)}
                    </div> :
                    null
                }
            </div>
        </div>
    </div>
}
