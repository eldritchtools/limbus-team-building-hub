import { EgoImg, Icon, IdentityImg, KeywordIcon, RarityImg, SinnerIcon, useData } from "@eldritchtools/limbus-shared-library";
import { keywordIconConvert } from "@/app/keywordIds";
import Link from "next/link";
import "./SinnerGrid.css";
import { ColorResist, LEVEL_CAP } from "../utils";
import { constructHp } from "../identities/IdentityUtils";
import { EgoSkillLoader, IdentitySkillLoader } from "../components/SkillLoader";
import { useMemo } from "react";

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

    return identity && displayType !== null ? <Link href={`/identities/${identity.id}`}>
        <div style={{ position: "relative", width: "100%" }} data-tooltip-id="identity-tooltip" data-tooltip-content={identity.id}>
            <IdentityImg identity={identity} uptie={(!uptie || uptie === "") ? 4 : uptie} displayName={displayType === "names"} displayRarity={true} {...otherProps} />
        </div>
    </Link > : <div style={{ width: "100%", aspectRatio: "1/1", boxSizing: "border-box" }} />
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

    return ego && displayType !== null ? <Link href={`/egos/${ego.id}`}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", aspectRatio: "4/1" }} data-tooltip-id="ego-tooltip" data-tooltip-content={ego.id}>
            <EgoImg ego={ego} banner={true} type={"awaken"} displayName={displayType === "names"} displayRarity={false} {...otherProps} />
        </div>
    </Link> : <div style={{ width: "100%", aspectRatio: "4/1", boxSizing: "border-box" }} />
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

function OverlayContainer({ displayType, identity, egos, identityLevel, identityUptie, egoThreadspins, children }) {
    if (["names", "icons"].includes(displayType)) return children;

    const constructOverlay = (behind, content, blockHover) => {
        return <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: "inherit" }}>
            {behind}
            <div style={{ position: "absolute", inset: 0, background: "rgba(0, 0, 0, 0.75)", pointerEvents: blockHover ? null : "none" }}>
                {content}
            </div>
        </div>
    }

    if (displayType === "stats") {
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
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem" }}>
                        <Icon path={"Slash"} style={{ height: "32px" }} />
                        <ColorResist resist={identity.resists.slash} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem" }}>
                        <Icon path={"Pierce"} style={{ height: "32px" }} />
                        <ColorResist resist={identity.resists.pierce} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem" }}>
                        <Icon path={"Blunt"} style={{ height: "32px" }} />
                        <ColorResist resist={identity.resists.blunt} />
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
        const overlayStyle = { fontSize: "1rem", position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", background: "rgba(0, 0, 0, 0.2)" };

        return constructOverlay(children,
            <div style={{ display: "grid", gridTemplateRows: "repeat(5, 1fr)", width: "100%", height: "100%" }}>
                {egos.map((ego, i) =>
                    <div key={i} style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
                        {ego ? <>
                            {displayType === "egocosts" ?
                                Object.entries(ego.cost).map(([affinity, cost]) =>
                                    <div key={affinity} style={{ position: "relative", display: "flex", width: "10%" }}>
                                        <Icon path={affinity} style={{ width: "100%", height: "auto" }} />
                                        <span style={overlayStyle}>x{cost}</span>
                                    </div>) :
                                affinities.map(affinity =>
                                    <div key={affinity} style={{ position: "relative", display: "flex", width: "10%" }}>
                                        <Icon path={affinity} style={{ width: "100%", height: "auto" }} />
                                        <span style={overlayStyle}>
                                            <ColorResist resist={ego.resists[affinity]} />
                                        </span>
                                    </div>)
                            }
                        </> : null}
                    </div>
                )}
            </div>
        )
    }


    return children;
}

export default function SinnerGrid({ identityIds, egoIds, identityUpties, identityLevels, egoThreadspins, deploymentOrder, activeSinners, displayType }) {
    const [identities, identitiesLoading] = useData("identities");
    const [egos, egosLoading] = useData("egos");

    // Convert empty strings (from editing) to nulls
    const upties = useMemo(() => identityUpties ? identityUpties.map(x => x === "" ? null : x) : null, [identityUpties]);
    const levels = useMemo(() => identityLevels ? identityLevels.map(x => x === "" ? null : x) : null, [identityLevels]);
    const threadspins = useMemo(() => egoThreadspins ? egoThreadspins.map(x => x.map(y => y === "" ? null : y)) : null, [egoThreadspins]);

    if (identitiesLoading || egosLoading) return null;

    return <div className="sinner-grid" style={{ alignSelf: "center", transform: "translateZ(0)" }}>
        {Array.from({ length: 12 }, (_, index) =>
            <OverlayContainer
                key={index}
                displayType={displayType}
                identity={identities[identityIds[index]] || null}
                egos={egoIds[index].map(id => egos[id] || null)}
                identityLevel={levels ? levels[index] : null}
                identityUptie={upties ? upties[index] : null}
                egoThreadspins={threadspins ? threadspins[index] : null}
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
}
