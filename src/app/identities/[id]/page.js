"use client";

import React, { useState } from "react";
import { Icon, IdentityImg, KeywordIcon, RarityImg, SinnerIcon, useData } from '@eldritchtools/limbus-shared-library';
import { ColorResist, getSeasonString, sinnerMapping } from "@/app/utils";
import { Tooltip } from "react-tooltip";
import { tooltipStyle } from "../../styles";
import SkillCard from "@/app/components/SkillCard";
import PassiveCard from "@/app/components/PassiveCard";
import UptieSelector from "@/app/components/UptieSelector";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";

const LEVEL_CAP = 55;

function constructHp(data, level) {
    const hp = Math.floor(data.hp.base + level * data.hp.level);
    const thresholds = data.breakSection.toReversed().map(x => Math.floor(hp * x / 100)).join(",");

    return `${hp} (${thresholds})`;
}

function LevelInput({ value, setValue, min = 1, max = 100 }) {
    return (
        <div style={{
            display: "inline-flex",
            alignItems: "center",
            border: "1px solid #444",
            borderRadius: "8px",
            padding: "4px",
            background: "#1f1f1f",
        }}>
            <button
                onClick={() => setValue(Math.max(min, value - 1))}
                style={{ marginRight: "6px" }}
            >−</button>
            <input
                type="text"
                value={value}
                onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v)) setValue(Math.min(max, Math.max(min, v)));
                }}
                style={{
                    width: "3ch",
                    textAlign: "center",
                    border: "none",
                    background: "transparent",
                    color: "white",
                    fontSize: "1rem",
                }}
            />
            <button
                onClick={() => setValue(Math.min(max, value + 1))}
                style={{ marginLeft: "6px" }}
            >+</button>
        </div>
    );
}

export default function Identity({ params }) {
    const { id } = React.use(params);
    const [identities, identitiesLoading] = useData("identities");
    const [skillData, skillDataLoading] = useData(`identities/${id}`);
    const identityData = identitiesLoading ? null : identities[id];
    const [uptie, setUptie] = useState(4);
    const [level, setLevel] = useState(LEVEL_CAP);

    const combatPassives = skillDataLoading ? null : skillData.combatPassives.findLast(passives => passives.level <= uptie);
    const supportPassives = skillDataLoading ? null : skillData.supportPassives.findLast(passives => passives.level <= uptie);

    if (identitiesLoading || skillDataLoading) return null;

    return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", padding: "1rem", width: "384px" }}>
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "0.5rem", width: "100%" }}>
                    <RarityImg rarity={identityData.rank} style={{ display: "inline", height: "2rem" }} />
                    <div style={{ display: "flex", flexDirection: "column", fontSize: "1.2rem", fontWeight: "bold", alignItems: "center" }}>
                        <span>{sinnerMapping[identityData.sinnerId]}</span>
                        <span>{identityData.name}</span>
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem", justifyContent: "center", padding: "0.5rem" }}>
                    <SinnerIcon num={identityData.sinnerId} style={{ height: "40px" }} />
                    Uptie: <UptieSelector value={uptie} setValue={setUptie} />
                    Level: <LevelInput value={level} setValue={setLevel} min={1} max={LEVEL_CAP} />
                </div>
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
                    <IdentityImg identity={identityData} uptie={2} scale={0.75} />
                    {identityData.tags.includes("Base Identity") ? null : <IdentityImg identity={identityData} uptie={4} scale={0.75} />}
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
                <div style={{ border: "1px #777 dotted", padding: "0.2rem", textAlign: "center" }}>
                    {identityData.skillKeywordList.map(x => <KeywordIcon key={x} id={x} />)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", border: "1px #777 dotted", padding: "0.2rem", gap: "0.2rem" }}>
                    <div data-tooltip-id="identity-notes" style={{ alignSelf: "center", textAlign: "center", borderBottom: "1px #aaa dotted" }}>
                        Notes, Comments, Explanation
                    </div>
                    <Tooltip id="identity-notes" style={tooltipStyle}>
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
                    <div style={{ color: "#aaa", fontSize: "0.8rem" }}>
                        Short
                    </div>
                    {identityData.notes && identityData.notes.short ?
                        <MarkdownRenderer content={identityData.notes.short} /> :
                        <div style={{ color: "#777", textAlign: "center" }}>Not yet available...</div>}
                    <div style={{ color: "#aaa", fontSize: "0.8rem" }}>
                        Full
                    </div>
                    {identityData.notes && identityData.notes.full ?
                        <MarkdownRenderer content={identityData.notes.full} /> :
                        <div style={{ color: "#777", textAlign: "center" }}>Not yet available...</div>}
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "0.5rem" }}>
                {[1, 2, 3, 4].map(tier => {
                    const list = identityData.skillTypes.filter(skill => skill.type.tier === tier);
                    return <div key={tier} style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
                        {list.map((skill, index) => <div key={skill.id} style={{ flex: 1 }}><SkillCard skill={skillData.skills[skill.id]} uptie={uptie} count={skill.num} level={level} index={index} /></div>)}
                    </div>
                })}
                <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
                    {identityData.defenseSkillTypes.map(skill => <div key={skill.id} style={{ flex: 1 }}><SkillCard key={skill.id} skill={skillData.skills[skill.id]} uptie={uptie} level={level} type={"defense"} /></div>)}
                </div>
                {combatPassives ?
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ color: "#aaa", fontWeight: "bold", fontSize: "1.25rem" }}>Combat Passives</div>
                        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
                            {combatPassives.passives.map((passive, i) => <div key={i} style={{ flex: 1 }}><PassiveCard passive={skillData.passiveData[passive]} /></div>)}
                        </div>
                    </div> :
                    null
                }
                {supportPassives ?
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ color: "#aaa", fontWeight: "bold", fontSize: "1.25rem" }}>Support Passives</div>
                        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
                            {supportPassives.passives.map((passive, i) => <div key={i} style={{ flex: 1 }}><PassiveCard passive={skillData.passiveData[passive]} /></div>)}
                        </div>
                    </div> :
                    null
                }
            </div>
        </div>
    </div>
}
