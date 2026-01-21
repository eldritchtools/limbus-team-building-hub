"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import * as Select from "@radix-ui/react-select";
import { getBuild, insertBuild, updateBuild } from "../database/builds";
import "./buildSelector.css";
import { affinityColorMapping, EgoImg, IdentityImg, KeywordIcon, RarityImg, SinnerIcon, useData } from "@eldritchtools/limbus-shared-library";
import { keywordIdMapping, keywordToIdMapping } from "../keywordIds";
import TagSelector, { tagToTagSelectorOption } from "../components/TagSelector";
import { useAuth } from "../database/authProvider";
import { useRouter } from "next/navigation";
import MarkdownEditorWrapper from "../components/Markdown/MarkdownEditorWrapper";
import "./SinnerGrid.css";
import { extractYouTubeId } from "../YoutubeUtils";
import NumberInputWithButtons from "../components/NumberInputWithButtons";
import { LEVEL_CAP } from "../utils";
import UptieSelector from "../components/UptieSelector";
import { generalTooltipProps } from "../components/GeneralTooltip";
import { decodeBuildExtraOpts, encodeBuildExtraOpts } from "../components/BuildExtraOpts";
import DisplayTypeButton from "./DisplayTypeButton";
import SinnerGrid from "./SinnerGrid";
import { isTouchDevice } from "@eldritchtools/shared-components";
import { buildsStore } from "../database/localDB";
import SinDistribution from "../components/SinDistribution";
import { constructTeamCode, parseTeamCode } from "../components/TeamCodeEncoding";

const egoRankMapping = {
    "ZAYIN": 0,
    "TETH": 1,
    "HE": 2,
    "WAW": 3,
    "ALEPH": 4
}

const egoRankReverseMapping = {
    0: "zayin",
    1: "teth",
    2: "he",
    3: "waw",
    4: "aleph"
}

function IdentitySelector({ value, setValue, options, num }) {
    const [filter, setFilter] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef(null);

    const filtered = useMemo(() => {
        if (!filter) return options;
        return options.filter((opt) =>
            opt.name.toLowerCase().includes(filter.toLowerCase())
        );
    }, [filter, options]);

    const handleOpenChange = (open) => {
        setIsOpen(open);
        setFilter("");
    }

    return (
        <Select.Root value={value ? value.id : null} onValueChange={v => setValue(v)} open={isOpen} onOpenChange={handleOpenChange}>
            <Select.Trigger className="identity-select-trigger" ref={triggerRef} style={{ width: "100%", padding: 0, margin: 0, boxSizing: "border-box" }}>
                {value ? <div
                    data-tooltip-id={isTouchDevice() ? null : "identity-tooltip"}
                    data-tooltip-content={isTouchDevice() ? null : value.id}
                    style={{ width: "100%", position: "relative" }}>
                    <IdentityImg identity={value} uptie={4} displayName={true} displayRarity={true} />
                </div> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <SinnerIcon num={num} style={{ height: "75%", width: "75%" }} />
                </div>}
            </Select.Trigger>

            <Select.Portal>
                <Select.Content className="identity-select-content" position="popper" style={{ width: null, maxWidth: "clamp(300px, 80vw, 900px)" }}>
                    <div style={{ paddingBottom: "0.2rem" }}>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>

                    <Select.Viewport>
                        <div className="identity-select-grid" style={{ maxWidth: "clamp(300px, 80vw, 900px)" }}>
                            {filtered.map((option) =>
                                <Select.Item key={option.id} value={option.id} className="identity-select-item">
                                    <div className="identity-item-inner" data-tooltip-id="identity-tooltip" data-tooltip-content={option.id}>
                                        <IdentityImg identity={option} uptie={4} displayName={true} displayRarity={true} />
                                    </div>
                                </Select.Item>
                            )}
                            {value ? <Select.Item key={"cancel"} value={null} className="identity-select-item">
                                <div className="identity-item-inner" style={{ height: "100%", justifyContent: "center", color: "#ff4848", fontSize: "3rem", fontWeight: "bold" }}>
                                    ✕
                                </div>
                            </Select.Item> : null}
                        </div>
                        {filtered.length > 12 ? <div className="identity-select-fade-bottom" > ▼ </div> : null}
                    </Select.Viewport>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    );
}

function EgoSelector({ value, setValue, options, rank }) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef(null);

    return (
        <Select.Root value={value ? value.id : null} onValueChange={v => setValue(v)} open={isOpen} onOpenChange={setIsOpen}>
            <Select.Trigger className="ego-select-trigger" ref={triggerRef} style={{ borderColor: value ? affinityColorMapping[value.affinity] : "#555", flex: 1, padding: 0, margin: 0, boxSizing: "border-box" }}>
                {value ? <div
                    data-tooltip-id={isTouchDevice() ? null : "ego-tooltip"}
                    data-tooltip-content={isTouchDevice() ? null : value.id}
                    style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", aspectRatio: "4/1" }}>
                    <EgoImg ego={value} banner={true} type={"awaken"} displayName={true} displayRarity={false} />
                </div> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <RarityImg rarity={egoRankReverseMapping[rank]} alt={true} style={{ width: "18%", height: "auto" }} />
                </div>}
            </Select.Trigger>

            <Select.Portal>
                <Select.Content className="ego-select-content" position="popper" style={{ maxWidth: "clamp(300px, 80vw, 900px)" }}>
                    {options.length === 0 ? <div style={{ fontSize: "1.2rem", padding: "0.5rem" }}>No Options</div> : null}
                    <Select.Viewport>
                        <div className="ego-select-grid" style={{ maxWidth: "clamp(300px, 80vw, 900px)" }}>
                            {options.map((option) =>
                                <Select.Item key={option.id} value={option.id} className="ego-select-item">
                                    <div className="ego-item-inner" data-tooltip-id="ego-tooltip" data-tooltip-content={option.id}>
                                        <EgoImg ego={option} type={"awaken"} displayName={true} displayRarity={false} />
                                    </div>
                                </Select.Item>
                            )}
                            {value ? <Select.Item key={"cancel"} value={null} className="ego-select-item">
                                <div className="ego-item-inner" style={{ height: "100%", width: "128px", justifyContent: "center", color: "#ff4848", fontSize: "3rem", fontWeight: "bold" }}>
                                    ✕
                                </div>
                            </Select.Item> : null}
                        </div>
                        {options.length > 12 ? <div className="ego-select-fade-bottom" > ▼ </div> : null}
                    </Select.Viewport>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    );
}

const deploymentComponentStyle = {
    flex: 1,
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    margin: 0,
    containerType: "size"
}

function DeploymentComponent({ order, setOrder, activeSinners, sinnerId }) {
    const index = order.findIndex(x => x === sinnerId);
    if (index === -1) {
        return <button onClick={() => setOrder(p => [...p, sinnerId])} style={deploymentComponentStyle}>
            <span style={{ fontSize: `clamp(0.6rem, 20cqw, 1.5rem)` }}>Deploy</span>
        </button>
    } else if (index < activeSinners) {
        return <button onClick={() => setOrder(p => p.filter(x => x !== sinnerId))} style={deploymentComponentStyle}>
            <span style={{ fontSize: `clamp(0.6rem, 20cqw, 1.5rem)`, color: "#fefe3d" }}>Active {index + 1}</span>
        </button>
    } else {
        return <button onClick={() => setOrder(p => p.filter(x => x !== sinnerId))} style={deploymentComponentStyle}>
            <span style={{ fontSize: `clamp(0.6rem, 20cqw, 1.5rem)`, color: "#29fee9" }}>Backup {index + 1}</span>
        </button>
    }
}

function isLocalId(id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return !uuidRegex.test(id);
}

export default function BuildEditor({ mode, buildId }) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [identityIds, setIdentityIds] = useState(Array.from({ length: 12 }, () => null));
    const [egoIds, setEgoIds] = useState(Array.from({ length: 12 }, () => Array.from({ length: 5 }, () => null)));
    const [keywordIds, setKeywordIds] = useState([]);
    const [deploymentOrder, setDeploymentOrder] = useState([]);
    const [activeSinners, setActiveSinners] = useState(7);
    const [teamCode, setTeamCode] = useState('');
    const [youtubeVideo, setYoutubeVideo] = useState('');
    const [tags, setTags] = useState([]);
    const [uptieLevelToggle, setUptieLevelToggle] = useState(false);
    const [identityUpties, setIdentityUpties] = useState(Array.from({ length: 12 }, () => ""));
    const [identityLevels, setIdentityLevels] = useState(Array.from({ length: 12 }, () => ""));
    const [egoThreadspins, setEgoThreadspins] = useState(Array.from({ length: 12 }, () => Array.from({ length: 5 }, () => "")));
    const [isPublished, setIsPublished] = useState(false);
    const [loading, setLoading] = useState(mode === "edit");
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [displayType, setDisplayType] = useState("edit");
    const [createdAt, setCreatedAt] = useState(null);
    const { user } = useAuth();
    const router = useRouter();

    const [identities, identitiesLoading] = useData("identities_mini");
    const [egos, egosLoading] = useData("egos_mini");

    useEffect(() => {
        if (mode === "edit") {
            const handleBuild = build => {
                if (!build) router.back();
                if (build.username || isLocalId(buildId)) {
                    setTitle(build.title);
                    setBody(build.body);
                    setIdentityIds(build.identity_ids);
                    setEgoIds(build.ego_ids);
                    setKeywordIds(build.keyword_ids.map(kw => keywordIdMapping[kw]));
                    setDeploymentOrder(build.deployment_order);
                    setActiveSinners(build.active_sinners);
                    setTeamCode(build.team_code);
                    setYoutubeVideo(build.youtube_video_id ?? '');
                    setTags(build.tags.map(t => tagToTagSelectorOption(t)));
                    setIsPublished(build.is_published);
                    setLoading(false);

                    if (build.extra_opts) {
                        const extraOpts = decodeBuildExtraOpts(build.extra_opts);
                        if (Object.keys(extraOpts).length > 0) setUptieLevelToggle(true);
                        if ("identityLevels" in extraOpts) setIdentityLevels(extraOpts.identityLevels);
                        if ("identityUpties" in extraOpts) setIdentityUpties(extraOpts.identityUpties);
                        if ("egoThreadspins" in extraOpts) setEgoThreadspins(extraOpts.egoThreadspins);
                    }

                    if (build.created_at) setCreatedAt(build.created_at);
                }
            }

            if (user)
                getBuild(buildId, true).then(handleBuild).catch(_err => {
                    router.push(`/builds/${buildId}`);
                });
            else
                buildsStore.get(Number(buildId)).then(handleBuild).catch(_err => {
                    router.push(`/builds/${buildId}`);
                });
        }
    }, [mode, buildId, router, user]);

    const identityOptions = useMemo(() => identitiesLoading ? null : Object.entries(identities).reverse().reduce((acc, [_, identity]) => {
        acc[identity.sinnerId].push(identity); return acc;
    }, Object.fromEntries(Array.from({ length: 12 }, (_, index) => [index + 1, []]))), [identities, identitiesLoading]);

    const setIdentityId = (identityId, index) => setIdentityIds(prev => prev.map((x, i) => i === index ? identityId : x));

    const egoOptions = useMemo(() => egosLoading ? null : Object.entries(egos).reverse().reduce((acc, [_, ego]) => {
        acc[ego.sinnerId][egoRankMapping[ego.rank]].push(ego); return acc;
    }, Object.fromEntries(Array.from({ length: 12 }, (_, index) => [index + 1, Array.from({ length: 5 }, () => [])]))), [egos, egosLoading]);

    const setEgoId = (egoId, index, rank) => setEgoIds(prev => prev.map((x, i) => i === index ? x.map((y, r) => r === rank ? egoId : y) : x));

    const setIdentityLevel = (level, index) => setIdentityLevels(prev => prev.map((x, i) => i === index ? level : x));
    const setIdentityUptie = (uptie, index) => setIdentityUpties(prev => prev.map((x, i) => i === index ? uptie : x));
    const setEgoThreadspin = (uptie, index, rank) => setEgoThreadspins(prev => prev.map((x, i) => i === index ? x.map((y, r) => r === rank ? uptie : y) : x));

    const keywordOptions = useMemo(() => identitiesLoading ? {} : identityIds.reduce((acc, id) => {
        if (id) {
            [...identities[id].types, ...identities[id].affinities, ...(identities[id].skillKeywordList ?? [])].forEach(x => {
                if (x in acc)
                    acc[x] += 1;
                else
                    acc[x] = 1;
            })
        }
        return acc;
    }, {}), [identityIds, identities, identitiesLoading]);

    const handleSave = async (isPublished) => {
        if (title === "") {
            setMessage("Title is required.")
            return;
        }

        if (title.length < 3 || title.length > 100) {
            setMessage("Title must be between 3-100 characters.");
            return;
        }

        const keywordsConverted = keywordIds.map(kw => keywordToIdMapping[kw]);
        const tagsConverted = tags.map(t => t.value);
        const youtubeVideoId = extractYouTubeId(youtubeVideo.trim());

        if (youtubeVideo.trim().length > 0 && youtubeVideoId === null) {
            setMessage("Invalid YouTube video id.");
            return;
        }

        const extraOpts = encodeBuildExtraOpts(identityUpties, identityLevels, egoThreadspins);

        setSaving(true);
        if (user) {
            if (mode === "edit") {
                const data = await updateBuild(buildId, user.id, title, body, identityIds, egoIds, keywordsConverted, deploymentOrder, activeSinners, teamCode, youtubeVideoId, tagsConverted, extraOpts, isPublished);
                router.push(`/builds/${data}`);
            } else {
                const data = await insertBuild(user.id, title, body, identityIds, egoIds, keywordsConverted, deploymentOrder, activeSinners, teamCode, youtubeVideoId, tagsConverted, extraOpts, isPublished);
                router.push(`/builds/${data}`);
            }
        } else {
            const buildData = {
                title: title,
                body: body,
                identity_ids: identityIds,
                ego_ids: egoIds,
                keyword_ids: keywordsConverted,
                deployment_order: deploymentOrder,
                active_sinners: activeSinners,
                team_code: teamCode,
                youtube_video_id: youtubeVideoId,
                like_count: 0,
                comment_count: 0,
                tags: tagsConverted,
                is_published: false,
                created_at: createdAt ?? Date.now(),
                updated_at: Date.now(),
                extra_opts: encodeBuildExtraOpts(identityUpties, identityLevels, egoThreadspins)
            }

            if (mode === "edit") buildData.id = Number(buildId);

            const data = await buildsStore.save(buildData)
            router.push(`/builds/${data}`);
        }
    }

    useEffect(() => {
        const teamCode = constructTeamCode(identityIds, egoIds, deploymentOrder);
        setTeamCode(teamCode);
    }, [identityIds, egoIds, deploymentOrder]);

    const handleSetTeamCode = (v) => {
        setTeamCode(v);
        const parseResult = parseTeamCode(v);
        if (!parseResult) return;
        setDeploymentOrder([...parseResult.deploymentOrder]);
        setIdentityIds([...parseResult.identities]);
        setEgoIds(parseResult.egos.map(egos => [...egos]));
    }

    return loading ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: "1.5rem", fontWeight: "bold" }}>
        Loading...
    </div> : <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", containerType: "inline-size" }}>
        {!user ?
            <div style={{ color: "rgba(255, 99, 71, 0.85)" }}>When not logged in, builds are saved locally on this device. After logging in, you can sync them to your account. Builds that are not synced cannot be accessed while logged in.</div>
            : null
        }
        <span style={{ fontSize: "1.2rem" }}>Title</span>
        <input type="text" value={title} style={{ width: "clamp(20ch, 80%, 100ch)" }} onChange={e => setTitle(e.target.value)} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "1.2rem" }}>Team Build</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                <div>Display Type</div>
                <DisplayTypeButton value={displayType} setValue={setDisplayType} includeEdit={true} />
            </div>
        </div>
        {identitiesLoading || egosLoading ? null :
            (
                displayType === "edit" ?
                    <div className="sinner-grid" style={{ alignSelf: "center", width: "98%", paddingBottom: "1rem" }}>
                        {Array.from({ length: 12 }, (_, index) =>
                            <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", width: "100%", boxSizing: "border-box" }}>
                                    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
                                        <IdentitySelector value={identities[identityIds[index]] || null} setValue={v => setIdentityId(v, index)} options={identityOptions[index + 1]} num={index + 1} />
                                        <DeploymentComponent order={deploymentOrder} setOrder={setDeploymentOrder} activeSinners={activeSinners} sinnerId={index + 1} />
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
                                        {Array.from({ length: 5 }, (_, rank) =>
                                            <EgoSelector key={rank} value={egos[egoIds[index][rank]] || null} setValue={v => setEgoId(v, index, rank)} options={egoOptions[index + 1][rank]} rank={rank} />
                                        )}
                                    </div>
                                </div>
                                {uptieLevelToggle ? <>
                                    <div style={{ display: "flex" }}>
                                        <NumberInputWithButtons value={identityLevels[index]} setValue={v => setIdentityLevel(v, index)} max={LEVEL_CAP} allowEmpty={true} />
                                        <UptieSelector value={identityUpties[index]} setValue={v => setIdentityUptie(v, index)} allowEmpty={true} />
                                    </div>
                                    <div style={{ display: "flex" }}>
                                        {Array.from({ length: 5 }, (_, rank) =>
                                            <UptieSelector
                                                key={rank}
                                                value={egoThreadspins[index][rank]}
                                                setValue={v => setEgoThreadspin(v, index, rank)}
                                                allowEmpty={true}
                                                emptyIcon={<RarityImg rarity={egoRankReverseMapping[rank]} alt={true} style={{ width: "100%", height: "auto" }} />}
                                            />)}
                                    </div>
                                </> : null}
                            </div>
                        )}
                    </div> :
                    <SinnerGrid
                        identityIds={identityIds}
                        egoIds={egoIds}
                        identityUpties={identityUpties}
                        identityLevels={identityLevels}
                        egoThreadspins={egoThreadspins}
                        deploymentOrder={deploymentOrder}
                        activeSinners={activeSinners}
                        displayType={displayType}
                    />

            )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "1px #aaa solid", borderRadius: "1rem", padding: "0.5rem" }}>
                <button
                    className={uptieLevelToggle ? "toggle-button-active" : "toggle-button"}
                    onClick={() => setUptieLevelToggle(p => !p)}
                    {...generalTooltipProps("optionaluptieorlevel")}
                >
                    Toggle Uptie and Level Inputs
                </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", border: "1px #aaa solid", borderRadius: "1rem", padding: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ fontSize: "1.2rem" }}>Active Sinners</span>
                    <NumberInputWithButtons value={activeSinners} setValue={setActiveSinners} min={1} max={12} />
                </div>
                <button onClick={() => setDeploymentOrder([])} style={{ fontSize: "1.2rem" }}>Reset Deployment Order</button>
            </div>
            <div style={{ border: "1px #aaa solid", borderRadius: "1rem", padding: "0.5rem" }}>
                <SinDistribution identityIds={identityIds} deploymentOrder={deploymentOrder} activeSinners={activeSinners} />
            </div>
        </div>
        <span style={{ fontSize: "1.2rem" }}>Description</span>
        <div className={{ maxWidth: "48rem", marginLeft: "auto", marginRight: "auto" }}>
            <MarkdownEditorWrapper value={body} onChange={setBody} placeholder={"Describe your build here..."} />
        </div>
        <span style={{ fontSize: "1.2rem" }}>Keywords</span>
        <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: "0.2rem", alignItems: "center", minHeight: "50px", flexWrap: "wrap" }}>
                <span style={{ paddingRight: "0.2rem" }}>Selected:</span>
                {keywordIds.map(x =>
                    <button key={x} onClick={() => setKeywordIds(p => p.filter(k => k !== x))} style={{ display: "flex", alignItems: "center", fontSize: "1rem" }}>
                        <KeywordIcon id={x} />
                    </button>
                )}
            </div>
            <div style={{ display: "flex", gap: "0.2rem", alignItems: "center", minHeight: "50px", flexWrap: "wrap" }}>
                <span style={{ paddingRight: "0.2rem" }}>Recommended:</span>
                {
                    Object.entries(keywordOptions)
                        .filter(([x, _]) => !keywordIds.includes(x))
                        .sort((a, b) => b[1] === a[1] ? keywordToIdMapping[a[0]] - keywordToIdMapping[b[0]] : b[1] - a[1])
                        .map(([x, n]) =>
                            <button key={x} onClick={() => setKeywordIds(p => [...p, x])} style={{ display: "flex", alignItems: "center", fontSize: "1rem" }}>
                                <KeywordIcon id={x} />
                            </button>
                        )
                }
            </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <div>
                <span style={{ fontSize: "1.2rem", borderBottom: "1px #ddd dotted" }} {...generalTooltipProps("teamcode")}>Team Code</span>
            </div>
            <span style={{ fontSize: "1rem", color: "#aaa" }}>
                Pasting a valid team code will replace the current team. Any changes to the team will automatically update the code below. Missing identities and Zayin E.G.Os will default to their base versions in the team code.
            </span>
        </div>
        <div>
            <textarea value={teamCode} onChange={e => handleSetTeamCode(e.target.value)} rows={3} style={{ width: "clamp(20ch, 80%, 100ch)" }} />
        </div>
        <div>
            <span style={{ fontSize: "1.2rem" }} >Video</span>
        </div>
        <div>
            <input type="text" value={youtubeVideo} onChange={(e) => setYoutubeVideo(e.target.value)} placeholder="Paste a YouTube Video link or id (optional)" style={{ width: "clamp(20ch, 80%, 50ch)" }} />
        </div>
        {youtubeVideo.length > 0 ?
            <span style={{ fontSize: "0.8rem" }}>Youtube Video Id: {extractYouTubeId(youtubeVideo.trim()) ?? "Not found"}</span> :
            null}
        <span style={{ fontSize: "1.2rem" }}>Tags</span>
        <TagSelector selected={tags} onChange={setTags} creatable={true} />
        {user && !isPublished ? 
            <div style={{color: "#aaa"}}>
                {"Drafts can still be shared through the link, but aren't searchable and don't allow comments."}
            </div> :
            null
        }
        {isPublished ?
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button style={{ padding: "0.5rem", fontSize: "1.2rem" }} onClick={() => handleSave(true)} disabled={saving}>Update</button>
                <button style={{ padding: "0.5rem", fontSize: "1.2rem" }} onClick={() => router.back()} disabled={saving}>Cancel</button>
                <span>{message}</span>
            </div> :
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button style={{ padding: "0.5rem", fontSize: "1.2rem" }} onClick={() => handleSave(false)} disabled={saving}>Save as Draft</button>
                {user ?
                    <button style={{ padding: "0.5rem", fontSize: "1.2rem" }} onClick={() => handleSave(true)} disabled={saving}>Publish</button> :
                    null
                }
                <span>{message}</span>
            </div>
        }
    </div>
}
