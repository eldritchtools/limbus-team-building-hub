import { EgoImg, Icon, IdentityImg, KeywordIcon, RarityImg, SinnerIcon, useData } from "@eldritchtools/limbus-shared-library";
import { keywordIconConvert } from "@/app/keywordIds";
import "./SinnerGrid.css";
import { ColorResist, LEVEL_CAP } from "../utils";
import { constructHp } from "../identities/IdentityUtils";
import { EgoSkillLoader, IdentitySkillLoader } from "../components/SkillLoader";
import { useEffect, useMemo, useState } from "react";
import TooltipLink from "../components/TooltipLink";
import DropdownButton from "../components/DropdownButton";
import { EgoSkillCalc, IdentitySkillCalc } from "../components/SkillCalc";

function SkillTypes({ skillType, identityUptie }) {
    const showAffinity = !identityUptie || !("affinityUptie" in skillType) || identityUptie >= skillType.affinityUptie;

    return <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.2rem", width: "100%", height: "100%", justifyContent: "center" }}>
        {showAffinity ? <Icon path={skillType.affinity} style={{ width: "25%" }} /> : null}
        <Icon path={keywordIconConvert(skillType.type)} style={{ width: "25%" }} />
        {skillType.type === "counter" ? <Icon path={keywordIconConvert(skillType.atkType)} style={{ width: "25%" }} /> : null}
    </div>
}

function IdentityProfile({ identity, displayType, sinnerId, uptie, level }) {
    if (!identity) return <div style={{ width: "100%", aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <SinnerIcon num={sinnerId} style={{ width: "75%" }} />
    </div>

    const otherProps = {};
    if (uptie) otherProps.displayUptie = true;
    if (level) otherProps.level = level;

    return identity && displayType !== null ? <TooltipLink href={`/identities/${identity.id}`} tooltipId={"identity-tooltip"} tooltipContent={identity.id}>
        <div style={{ position: "relative", width: "100%" }}>
            <IdentityImg identity={identity} uptie={(!uptie || uptie === "") ? 4 : uptie} displayName={displayType === "names"} displayRarity={true} {...otherProps} />
        </div>
    </TooltipLink> : <div style={{ width: "100%", aspectRatio: "1/1", boxSizing: "border-box" }} />
}

const egoRankReverseMapping = {
    0: "zayin",
    1: "teth",
    2: "he",
    3: "waw",
    4: "aleph"
}

function EgoProfile({ ego, displayType, rank, threadspin }) {
    if (!ego) return <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", aspectRatio: "4/1" }}>
        <RarityImg rarity={egoRankReverseMapping[rank]} alt={true} style={{ width: "18%", height: "auto" }} />
    </div>

    const otherProps = {}
    if (threadspin) otherProps.threadspin = threadspin

    return ego && displayType !== null ? <TooltipLink href={`/egos/${ego.id}`} tooltipId={"ego-tooltip"} tooltipContent={ego.id}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", aspectRatio: "4/1" }}>
            <EgoImg ego={ego} banner={true} type={"awaken"} displayName={displayType === "names"} displayRarity={false} {...otherProps} />
        </div>
    </TooltipLink> : <div style={{ width: "100%", aspectRatio: "4/1", boxSizing: "border-box" }} />
}

const deploymentComponentStyle = {
    flex: 1,
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    containerType: "size"
}

function DeploymentComponent({ order, activeSinners, sinnerId }) {
    const index = order.findIndex(x => x === sinnerId);
    if (index === -1) {
        return <div style={deploymentComponentStyle} />
    } else if (index < activeSinners) {
        return <div style={deploymentComponentStyle}>
            <span style={{ fontSize: `clamp(0.6rem, 20cqw, 1.5rem)`, color: "#fefe3d" }}>Active {index + 1}</span>
        </div>
    } else {
        return <div style={deploymentComponentStyle}>
            <span style={{ fontSize: `clamp(0.6rem, 20cqw, 1.5rem)`, color: "#29fee9" }}>Backup {index + 1}</span>
        </div>
    }
}

function OverlayContainer({ displayType, identity, egos, identityLevel, identityUptie, egoThreadspins, otherOpts, children }) {
    if (["names", "icons"].includes(displayType)) return children;

    const constructOverlay = (behind, content, blockAccess) => {
        return <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: "inherit" }}>
            {behind}
            <div style={{ position: "absolute", inset: 0, background: "rgba(0, 0, 0, 0.75)", pointerEvents: blockAccess ? null : "none" }}>
                {content}
            </div>
        </div>
    }

    if (displayType === "stats") {
        const overlayStyle = { fontSize: "1rem", position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", background: "rgba(0, 0, 0, 0.2)" };

        return constructOverlay(children, identity ?
            <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", gap: "0.2rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem" }}>
                        <Icon path={"hp"} style={{ height: "32px" }} />
                        {constructHp(identity, identityLevel ?? LEVEL_CAP)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem" }}>
                        <Icon path={"speed"} style={{ height: "32px" }} />
                        {identity.speedList[(identityUptie ?? 4) - 1].join(" - ")}
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", textAlign: "center" }}>
                    <div style={{ position: "relative", display: "flex", justifyContent: "center", width: "100%" }}>
                        <Icon path={"Slash"} style={{ width: "32px", height: "32px" }} />
                        <span style={overlayStyle}><ColorResist resist={identity.resists.slash} /></span>
                    </div>
                    <div style={{ position: "relative", display: "flex", justifyContent: "center", width: "100%" }}>
                        <Icon path={"Pierce"} style={{ width: "32px", height: "32px" }} />
                        <span style={overlayStyle}><ColorResist resist={identity.resists.pierce} /></span>
                    </div>
                    <div style={{ position: "relative", display: "flex", justifyContent: "center", width: "100%" }}>
                        <Icon path={"Blunt"} style={{ width: "32px", height: "32px" }} />
                        <span style={overlayStyle}><ColorResist resist={identity.resists.blunt} /></span>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                    {identity.skillKeywordList.map(x => <KeywordIcon key={x} id={x} />)}
                </div>
            </div> : null
        )
    }

    if (displayType === "types") {
        return constructOverlay(children,
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <div style={{ display: "grid", gridTemplateRows: "repeat(5, 1fr)" }}>
                    {identity ? <>
                        {[0, 1, 2].map(x => <div key={x} style={{ display: "flex", justifyContent: "center" }}><SkillTypes skillType={identity.skillTypes[x].type} /></div>)}
                        {<SkillTypes key={3} skillType={identity.defenseSkillTypes[0].type} identityUptie={identityUptie} />}
                    </> : null}
                </div>
                <div style={{ display: "grid", gridTemplateRows: "repeat(5, 1fr)" }}>
                    {egos.map((ego, i) =>
                        <div key={i} style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
                            {ego ? <SkillTypes skillType={ego.awakeningType} /> : null}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const props = {};
    if (identityUptie) props.uptie = identityUptie;
    if (identityLevel) props.level = identityLevel;
    if (egoThreadspins) props.threadspins = egoThreadspins;

    if (["s1", "s2", "s3", "def", "skills", "passives1", "passives2"].includes(displayType)) {
        return constructOverlay(children,
            identity ?
                <IdentitySkillLoader identity={identity} type={displayType} {...props} /> :
                null,
            true
        )
    }

    if (["ego1", "ego2", "ego3", "ego4", "ego5"].includes(displayType)) {
        const num = Number(displayType.slice(-1)) - 1;

        return constructOverlay(children,
            egos ?
                <EgoSkillLoader egos={egos} type={"ego"} {...props} num={num} /> :
                null,
            true
        )
    }

    if (["egoa", "egob", "egopassives"].includes(displayType)) {
        return constructOverlay(children,
            egos ?
                <EgoSkillLoader egos={egos} type={displayType} {...props} /> :
                null,
            true
        )
    }

    if (displayType === "egocosts" || displayType === "egoresists") {
        const affinities = ["wrath", "lust", "sloth", "gluttony", "gloom", "pride", "envy"];
        const overlayStyle = { fontSize: "clamp(0.8rem, 50cqh, 1rem)", position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", background: "rgba(0, 0, 0, 0.2)" };

        return constructOverlay(children,
            <div style={{ display: "grid", gridTemplateRows: "repeat(5, 1fr)", width: "100%", height: "20%", containerType: "size" }}>
                {egos.map((ego, i) => {
                    if (!ego) return null;

                    if (displayType === "egocosts")
                        return <div key={i} style={{
                            display: "grid", gridTemplateColumns: `repeat(${Object.keys(ego.cost).length}, min(36px, 100cqh))`,
                            width: "100%", height: "100cqh", gap: "0.2rem", justifyContent: "center"
                        }}>
                            {Object.entries(ego.cost).map(([affinity, cost]) =>
                                <div key={affinity} style={{ position: "relative", display: "flex", justifyContent: "center", width: "100%", containerType: "size" }}>
                                    <Icon path={affinity} style={{ width: "clamp(1px, 100cqh, 32px)", height: "clamp(1px, 100cqh, 32px)" }} />
                                    <span style={overlayStyle}>x{cost}</span>
                                </div>)}
                        </div>

                    if (displayType === "egoresists")
                        return <div key={i} style={{
                            display: "grid", gridTemplateColumns: "repeat(7, min(36px, 100cqh))",
                            width: "100%", height: "100cqh", gap: "0.2rem", justifyContent: "center"
                        }}>
                            {affinities.map(affinity =>
                                <div key={affinity} style={{ position: "relative", display: "flex", justifyContent: "center", width: "100%", containerType: "size" }}>
                                    <Icon path={affinity} style={{ width: "clamp(1px, 100cqh, 32px)", height: "clamp(1px, 100cqh, 32px)" }} />
                                    <span style={overlayStyle}>
                                        <ColorResist resist={ego.resists[affinity]} />
                                    </span>
                                </div>)}
                        </div>

                    return null;
                }
                )}
            </div>
        )
    }

    if (displayType === "calc") {
        if (!otherOpts.source) return null;

        if (otherOpts.source === "identity") {
            return constructOverlay(children,
                identity ?
                    <IdentitySkillCalc identity={identity} uptie={identityUptie ?? undefined} level={identityLevel ?? undefined} opts={otherOpts} /> :
                    null,
                true
            );
        }

        if (otherOpts.source === "ego") {
            return constructOverlay(children,
                egos ?
                    <EgoSkillCalc egos={egos} threadspins={egoThreadspins ?? undefined} level={identityLevel ?? undefined} opts={otherOpts} /> :
                    null,
                true
            );
        }
    }

    return children;
}

function CalcComponent({ opts, setOpts }) {
    useEffect(() => {
        setOpts({ source: "identity", cond: "default", type: "max", sp: 0, view: "compress", target: {} });
    }, [setOpts]);

    const valueComponent = (name, key, def) => <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Icon path={name} style={{ width: "32px", height: "32px" }} />
        <input type="number" value={opts.target ? (opts.target[key] ?? def) : def}
            onChange={e => setOpts(p => ({ ...p, target: { ...p.target, [key]: Number(e.target.value) } }))}
            style={{ width: "3ch", textAlign: "center" }}
        />
    </div>

    return <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <span style={{textAlign: "center"}}>The numbers here are only meant to serve as a guide and may not be 100% accurate. These computations only count the skill in isolation and do not consider other effects such as statuses on the sinner/target, passives, resonance bonuses, and so on. Please report any errors in the discord.</span>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
                <span>Skill Info:</span>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                    <DropdownButton
                        value={opts.source ?? "identity"}
                        setValue={(x) => setOpts(p => ({ ...p, source: x }))}
                        options={{ "identity": "Identity Skills", "ego": "E.G.O Skills" }}
                    />
                    <DropdownButton
                        value={opts.view ?? "expand"}
                        setValue={(x) => setOpts(p => ({ ...p, view: x }))}
                        options={{ "compress": "Compressed View", "expand": "Expanded View" }}
                    />
                    <DropdownButton
                        value={opts.cond ?? "default"}
                        setValue={(x) => setOpts(p => ({ ...p, cond: x }))}
                        options={{ "default": "Default Values", "skill": "With Skill Effects", "all": "With Skill/Coin Effects" }}
                    />
                    <DropdownButton
                        value={opts.type ?? "max"}
                        setValue={(x) => setOpts(p => ({ ...p, type: x }))}
                        options={{ "max": "Max Rolls", "avg": "Average", "min": "Min Rolls" }}
                    />
                    {opts.type === "avg" ?
                        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            <span>SP:</span>
                            <input type="number" min={-45} max={45} value={opts.sp === 0 ? "" : (opts.sp ?? 0)}
                                onChange={e => setOpts(p => ({ ...p, sp: e.target.value === "" ? 0 : Math.min(45, Math.max(-45, Number(e.target.value))) }))}
                                style={{ width: "3ch", textAlign: "center" }}
                            />
                        </div> :
                        null}
                    <DropdownButton
                        value={opts.crit ?? "poise"}
                        setValue={(x) => setOpts(p => ({ ...p, crit: x }))}
                        options={{ "all": "Apply Crits to All", "poise": "Apply Crits to Poise Ids", "none": "Ignore Crits" }}
                    />
                </div>
                {<span style={{ whiteSpace: "pre-wrap", textAlign: "center" }}>
                    {opts.cond === "default" ?
                        "Using the skills' default base and coin power" :
                        opts.cond === "skill" ?
                            "Applying power and damage conditionals on the skill (excluding coin-specific effects)\nSkills marked with -- are not yet implemented and will be added over time." :
                            "Applying all power and damage conditionals on the skill and its coins\nSkills marked with -- are not yet implemented and will be added over time."
                    }
                </span>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
                <span>Target Levels and Resists:</span>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                    {valueComponent("offense level", "off", LEVEL_CAP)}
                    {valueComponent("defense level", "def", LEVEL_CAP)}
                    {valueComponent("Slash", "slash", 1)}
                    {valueComponent("Pierce", "pierce", 1)}
                    {valueComponent("Blunt", "blunt", 1)}
                    {valueComponent("wrath", "wrath", 1)}
                    {valueComponent("lust", "lust", 1)}
                    {valueComponent("sloth", "sloth", 1)}
                    {valueComponent("gluttony", "gluttony", 1)}
                    {valueComponent("gloom", "gloom", 1)}
                    {valueComponent("pride", "pride", 1)}
                    {valueComponent("envy", "envy", 1)}
                </div>
            </div>
        </div>
    </div>
}

export default function SinnerGrid({ identityIds, egoIds, identityUpties, identityLevels, egoThreadspins, deploymentOrder, activeSinners, displayType }) {
    const [identities, identitiesLoading] = useData("identities");
    const [egos, egosLoading] = useData("egos");

    // Convert empty strings (from editing) to nulls
    const upties = useMemo(() => identityUpties ? identityUpties.map(x => x === "" ? null : x) : null, [identityUpties]);
    const levels = useMemo(() => identityLevels ? identityLevels.map(x => x === "" ? null : x) : null, [identityLevels]);
    const threadspins = useMemo(() => egoThreadspins ? egoThreadspins.map(x => x.map(y => y === "" ? null : y)) : null, [egoThreadspins]);

    const [otherOpts, setOtherOpts] = useState({});

    if (identitiesLoading || egosLoading) return null;

    return <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center" }}>
        {
            displayType === "calc" ?
                <CalcComponent opts={otherOpts} setOpts={setOtherOpts} /> :
                null
        }

        <div className="sinner-grid" style={{ alignSelf: "center", transform: "translateZ(0)" }}>
            {Array.from({ length: 12 }, (_, index) =>
                <OverlayContainer
                    key={index}
                    displayType={displayType}
                    identity={identities[identityIds[index]] || null}
                    egos={egoIds[index].map(id => egos[id] || null)}
                    identityLevel={levels ? levels[index] : null}
                    identityUptie={upties ? upties[index] : null}
                    egoThreadspins={threadspins ? threadspins[index] : null}
                    otherOpts={otherOpts}
                >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", width: "100%", border: "1px #444 solid" }}>
                        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
                            <IdentityProfile
                                identity={identities[identityIds[index]] || null}
                                displayType={displayType}
                                sinnerId={index + 1}
                                uptie={upties ? upties[index] : null}
                                level={levels ? levels[index] : null}
                            />
                            <DeploymentComponent order={deploymentOrder} activeSinners={activeSinners} sinnerId={index + 1} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
                            {Array.from({ length: 5 }, (_, rank) =>
                                <EgoProfile
                                    key={rank}
                                    ego={egos[egoIds[index][rank]] || null}
                                    displayType={displayType}
                                    rank={rank}
                                    threadspin={threadspins ? threadspins[index][rank] : null}
                                />)}
                        </div>
                    </div>
                </OverlayContainer>
            )}
        </div>
    </div>
}
