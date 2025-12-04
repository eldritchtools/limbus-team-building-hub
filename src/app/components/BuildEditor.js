"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import * as Select from "@radix-ui/react-select";
import { getBuild, insertBuild, updateBuild } from "../database/builds";
import "./buildSelector.css";
import { EgoImg, IdentityImg, KeywordIcon, SinnerIcon, useData } from "@eldritchtools/limbus-shared-library";
import { keywordIdMapping, keywordToIdMapping } from "../keywordIds";
import TagSelector, { tagToTagSelectorOption } from "./TagSelector";
import { affinityColorMapping } from "../utils";
import { useAuth } from "../database/authProvider";
import { useRouter } from "next/navigation";
import MarkdownEditor from "./MarkdownEditor";
import "./SinnerGrid.css";

const egoRankMapping = {
    "ZAYIN": 0,
    "TETH": 1,
    "HE": 2,
    "WAW": 3,
    "ALEPH": 4
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
                {value ? <div data-tooltip-id="identity-tooltip" data-tooltip-content={value.id} style={{ width: "100%", position: "relative" }}>
                    <IdentityImg identity={value} uptie={4} displayName={false} width={"100%"} />
                    <div style={{
                        position: "absolute",
                        bottom: "5px",
                        right: "5px",
                        textAlign: "right",
                        textWrap: "balance",
                        textShadow: "1px 1px 4px #000, -1px 1px 4px #000, 1px -1px 4px #000, -1px -1px 4px #000, 0px 0px 8px rgba(0, 0, 0, 0.5), 0px 0px 12px rgba(0, 0, 0, 0.25)"
                    }}>
                        {value.name}
                    </div>
                </div> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <SinnerIcon num={num} style={{ height: "75%", width: "75%" }} />
                </div>}
            </Select.Trigger>

            <Select.Content className="identity-select-content" position="popper">
                <div style={{ paddingBottom: "0.2rem" }}>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>

                <Select.Viewport>
                    <div className="identity-select-grid">
                        {filtered.map((option) =>
                            <Select.Item key={option.id} value={option.id} className="identity-select-item">
                                <div className="identity-item-inner" data-tooltip-id="identity-tooltip" data-tooltip-content={option.id}>
                                    <IdentityImg identity={option} uptie={4} displayName={true} scale={0.5} />
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
        </Select.Root>
    );
}

function EgoSelector({ value, setValue, options }) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef(null);

    return (
        <Select.Root value={value ? value.id : null} onValueChange={v => setValue(v)} open={isOpen} onOpenChange={setIsOpen}>
            <Select.Trigger className="ego-select-trigger" ref={triggerRef} style={{ borderColor: value ? affinityColorMapping[value.affinity] : "#555", flex: 1, padding: 0, margin: 0, boxSizing: "border-box" }}>
                {value ? <div data-tooltip-id="ego-tooltip" data-tooltip-content={value.id} style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", aspectRatio: "4/1" }}>
                    <EgoImg ego={value} type={"awaken"} displayName={false} style={{ display: "block", width: "100%", height: null, aspectRatio: "4/1", objectFit: "cover" }} />
                    <div style={{
                        position: "absolute",
                        fontSize: "0.75rem",
                        color: affinityColorMapping[value.affinity],
                        maxHeight: "100%",
                        overflow: "hidden",
                        textWrap: "balance",
                        textShadow: "1px 1px 4px #000, -1px 1px 4px #000, 1px -1px 4px #000, -1px -1px 4px #000, 0px 0px 8px rgba(0, 0, 0, 0.5), 0px 0px 12px rgba(0, 0, 0, 0.25)"
                    }}>
                        {value.name}
                    </div>
                </div> : null}
            </Select.Trigger>

            <Select.Content className="ego-select-content" position="popper">
                {options.length === 0 ? <div style={{ fontSize: "1.2rem", padding: "0.5rem" }}>No Options</div> : null}
                <Select.Viewport>
                    <div className="ego-select-grid">
                        {options.map((option) =>
                            <Select.Item key={option.id} value={option.id} className="ego-select-item">
                                <div className="ego-item-inner" data-tooltip-id="ego-tooltip" data-tooltip-content={option.id}>
                                    <EgoImg ego={option} type={"awaken"} displayName={true} scale={0.5} />
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
        </Select.Root>
    );
}

function ActiveSinnersInput({ value, setValue, min = 1, max = 12 }) {
    return (
        <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid #444", borderRadius: "8px", padding: "4px" }}>
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
                style={{ width: "3ch", textAlign: "center", border: "none", background: "transparent", fontSize: "1rem" }}
            />
            <button
                onClick={() => setValue(Math.min(max, value + 1))}
                style={{ marginLeft: "6px" }}
            >+</button>
        </div>
    );
}

const deploymentComponentStyle = {
    flex: 1,
    fontSize: "1.5rem",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    margin: 0
}

function DeploymentComponent({ order, setOrder, activeSinners, sinnerId }) {
    const index = order.findIndex(x => x === sinnerId);
    if (index === -1) {
        return <button onClick={() => setOrder(p => [...p, sinnerId])} style={deploymentComponentStyle}>Deploy</button>
    } else if (index < activeSinners) {
        return <button onClick={() => setOrder(p => p.filter(x => x !== sinnerId))} style={{ ...deploymentComponentStyle, color: "#fefe3d" }}>Active {index + 1}</button>
    } else {
        return <button onClick={() => setOrder(p => p.filter(x => x !== sinnerId))} style={{ ...deploymentComponentStyle, color: "#29fee9" }}>Backup {index + 1 - activeSinners}</button>
    }
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
    const [tags, setTags] = useState([]);
    const [isPublished, setIsPublished] = useState(false);
    const [loading, setLoading] = useState(mode === "edit");
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    const [identities, identitiesLoading] = useData("identities_mini");
    const [egos, egosLoading] = useData("egos_mini");

    useEffect(() => {
        if (mode === "edit") {
            getBuild(buildId, true).then(build => {
                if (!build) router.back();
                if (build.username) {
                    setTitle(build.title);
                    setBody(build.body);
                    setIdentityIds(build.identity_ids);
                    setEgoIds(build.ego_ids);
                    setKeywordIds(build.keyword_ids.map(kw => keywordIdMapping[kw]));
                    setDeploymentOrder(build.deployment_order);
                    setActiveSinners(build.active_sinners);
                    setTeamCode(build.team_code);
                    setTags(build.tags.map(t => tagToTagSelectorOption(t)));
                    setIsPublished(build.is_published);
                    setLoading(false);
                }
            });
        }
    }, [mode, buildId, router]);

    const identityOptions = useMemo(() => identitiesLoading ? null : Object.entries(identities).reverse().reduce((acc, [_, identity]) => {
        acc[identity.sinnerId].push(identity); return acc;
    }, Object.fromEntries(Array.from({ length: 12 }, (_, index) => [index + 1, []]))), [identities, identitiesLoading]);

    const setIdentityId = (identityId, index) => setIdentityIds(prev => prev.map((x, i) => i === index ? identityId : x));

    const egoOptions = useMemo(() => egosLoading ? null : Object.entries(egos).reverse().reduce((acc, [_, ego]) => {
        acc[ego.sinnerId][egoRankMapping[ego.rank]].push(ego); return acc;
    }, Object.fromEntries(Array.from({ length: 12 }, (_, index) => [index + 1, Array.from({ length: 5 }, () => [])]))), [egos, egosLoading]);

    const setEgoId = (egoId, index, rank) => setEgoIds(prev => prev.map((x, i) => i === index ? x.map((y, r) => r === rank ? egoId : y) : x));

    const keywordOptions = useMemo(() => identitiesLoading ? {} : identityIds.reduce((acc, id) => {
        if (id) {
            [...identities[id].types, ...identities[id].affinities, ...identities[id].skillKeywordList].forEach(x => {
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
        const keywordsConverted = keywordIds.map(kw => keywordToIdMapping[kw]);
        const tagsConverted = tags.map(t => t.value);

        setSaving(true);
        if (mode === "edit") {
            const data = await updateBuild(buildId, user.id, title, body, identityIds, egoIds, keywordsConverted, deploymentOrder, activeSinners, teamCode, tagsConverted, isPublished);
            router.push(`/builds/${data}`);
        } else {
            const data = await insertBuild(user.id, title, body, identityIds, egoIds, keywordsConverted, deploymentOrder, activeSinners, teamCode, tagsConverted, isPublished);
            router.push(`/builds/${data}`);
        }
    }

    return loading ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: "1.5rem", fontWeight: "bold" }}>
        Loading...
    </div> : <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", containerType: "inline-size" }}>
        <span style={{ fontSize: "1.2rem" }}>Title</span>
        <input type="text" value={title} style={{ width: "100ch" }} onChange={e => setTitle(e.target.value)} />
        <span style={{ fontSize: "1.2rem" }}>Team Build</span>
        {identitiesLoading || egosLoading ? null :
            <div className="sinner-grid" style={{ alignSelf: "center", width: "98%", paddingBottom: "1rem" }}>
                {Array.from({ length: 12 }, (_, index) =>
                    <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", width: "100%", aspectRatio: "8/5", boxSizing: "border-box" }}>
                        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
                            <IdentitySelector value={identities[identityIds[index]] || null} setValue={v => setIdentityId(v, index)} options={identityOptions[index + 1]} num={index + 1} />
                            <DeploymentComponent order={deploymentOrder} setOrder={setDeploymentOrder} activeSinners={activeSinners} sinnerId={index + 1} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
                            {Array.from({ length: 5 }, (_, rank) => <EgoSelector key={rank} value={egos[egoIds[index][rank]] || null} setValue={v => setEgoId(v, index, rank)} options={egoOptions[index + 1][rank]} />)}
                        </div>
                    </div>
                )}
            </div>
        }

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontSize: "1.2rem" }}>Active Sinners</span>
            <ActiveSinnersInput value={activeSinners} setValue={setActiveSinners} />
            <button onClick={() => setDeploymentOrder([])} style={{ fontSize: "1.2rem" }}>Reset Deployment Order</button>
        </div>
        <span style={{ fontSize: "1.2rem" }}>Description</span>
        <div className={{ maxWidth: "48rem", marginLeft: "auto", marginRight: "auto" }}>
            <MarkdownEditor value={body} onChange={setBody} placeholder={"Describe your build here..."} />
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
        <div>
            <span style={{ fontSize: "1.2rem", borderBottom: "1px #ddd dotted" }} data-tooltip-id="team-code-tooltip">Team Code</span>
        </div>
        <div>
            <textarea value={teamCode} onChange={e => setTeamCode(e.target.value)} rows={3} cols={100} />
        </div>
        <span style={{ fontSize: "1.2rem" }}>Tags</span>
        <TagSelector selected={tags} onChange={setTags} creatable={true} />
        {isPublished ?
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button style={{ padding: "0.5rem", fontSize: "1.2rem" }} onClick={() => handleSave(true)} disabled={saving}>Update</button>
                <button style={{ padding: "0.5rem", fontSize: "1.2rem" }} onClick={() => router.back()} disabled={saving}>Cancel</button>
                <span>{message}</span>
            </div> :
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button style={{ padding: "0.5rem", fontSize: "1.2rem" }} onClick={() => handleSave(false)} disabled={saving}>Save as Draft</button>
                <button style={{ padding: "0.5rem", fontSize: "1.2rem" }} onClick={() => handleSave(true)} disabled={saving}>Publish</button>
                <span>{message}</span>
            </div>
        }
    </div>
}
