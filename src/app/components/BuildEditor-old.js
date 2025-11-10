"use client";

import { useState, useMemo } from "react";
import "easymde/dist/easymde.min.css";
import { getBuild } from "../database/builds";
import "./buildSelector.css";
import { EgoImg, IdentityImg, useData } from "@eldritchtools/limbus-shared-library";
import { keywordToIdMapping } from "../keywordIds";
import TagSelector from "./TagSelector";

import dynamic from "next/dynamic";
import { selectStyle } from "../styles";
const Select = dynamic(() => import("react-select"), { ssr: false });
const SimpleMDE = dynamic(() => import("react-simplemde-editor"), { ssr: false });

const egoRankMapping = {
    "ZAYIN": 0,
    "TETH": 1,
    "HE": 2,
    "WAW": 3,
    "ALEPH": 4
}

const activeColor = "#fefe3d";
const backupColor = "#29fee9";

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

function DeploymentComponent({ order, setOrder, activeSinners, sinnerId }) {
    const index = order.findIndex(x => x === sinnerId);
    if (index === -1) {
        return <button onClick={() => setOrder(p => [...p, sinnerId])}>Deploy Sinner</button>
    } else if (index < activeSinners) {
        return <button onClick={() => setOrder(p => p.filter(x => x !== sinnerId))}>Active {index + 1}</button>
    } else {
        return <button onClick={() => setOrder(p => p.filter(x => x !== sinnerId))}>Backup {index + 1 - activeSinners}</button>
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
    const [importString, setImportString] = useState('');
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(mode === "edit");

    const [identities, identitiesLoading] = useData("identities_mini");
    const [egos, egosLoading] = useData("egos_mini");

    if (mode === "edit") {
        getBuild(buildId, true).then(build => {
            if (build.username) {
                setTitle(build.title);
                setBody(build.body);
                setIdentityIds(build.identity_ids);
                setEgoIds(build.ego_ids);
                setKeywordIds(build.keyword_ids);
                setDeploymentOrder(build.deployment_order);
                setActiveSinners(build.active_sinners);
                setImportString(build.import_string);
                setTags(build.tags);
                setLoading(false);
            }
        });
    }

    const mdeOptions = useMemo(() => ({
        spellChecker: false,
        autofocus: true,
        placeholder: "Describe your build here...",
        status: false,
        toolbar: [
            "bold", "italic", "heading", "|",
            "quote", "unordered-list", "ordered-list", "|",
            "link", "image", "|",
            "preview", "guide"
        ],
    }), []);

    const [identityOptions, identityMap] = useMemo(() => identitiesLoading ? [[], {}] : Object.entries(identities).reduce(([acc, acc2], [_, identity]) => {
        const option = {
            value: identity.id,
            label: <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center" }}>
                <IdentityImg identity={identity} displayName={false} scale={0.15} />
                <span>{identity.name}</span>
            </div>,
            displayLabel: identity.name,
            name: identity.name
        };

        acc[identity.sinnerId].push(option);
        acc2[identity.id] = option;

        return [acc, acc2];
    }, [Object.fromEntries(Array.from({ length: 12 }, (_, index) => [index + 1, []])), {}]), [identities, identitiesLoading]);

    const [egoOptions, egoMap] = useMemo(() => egosLoading ? [[], {}] : Object.entries(egos).reduce(([acc, acc2], [id, ego]) => {
        const option = {
            value: ego.id,
            label: <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center" }}>
                <EgoImg ego={ego} displayName={false} type={"awaken"} scale={0.15} />
                <span>{ego.name}</span>
            </div>,
            displayLabel: ego.name,
            name: ego.name
        };

        acc[ego.sinnerId][egoRankMapping[ego.rank]].push(option);
        acc2[ego.id] = option

        return [acc, acc2];
    }, [Object.fromEntries(Array.from({ length: 12 }, (_, index) => [index + 1, Array.from({ length: 5 }, () => [])])), {}]), [egos, egosLoading]);

    const keywordOptions = useMemo(() => identitiesLoading ? [] : [...identityIds.reduce((acc, id) => {
        if (id) {
            identities[id].types.forEach(x => acc.add(x));
            identities[id].affinities.forEach(x => acc.add(x));
            identities[id].skillKeywordList.forEach(x => acc.add(x));
        }
        return acc;
    }, new Set())].map(x => keywordToIdMapping[x]), [identityIds, identities, identitiesLoading]);

    return loading ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: "1.5rem", fontWeight: "bold" }}>
        Loading...
    </div> : <div style={{ display: "flex", flexDirection: "column" }}>
        <span>Title</span>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} />
        <span>Build</span>
        {identitiesLoading || egosLoading ? null :
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)" }}>
                {Array.from({ length: 12 }, (_, index) => <div key={index} style={{ display: "flex", flexDirection: "row" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {identityIds[index] ? <IdentityImg id={identityIds[index]} displayName={false} scale={0.5} /> : <div style={{ width: "128px", height: "128px", border: "1px #777 solid" }}></div>}
                        <Select
                            options={identityOptions[index + 1]}
                            value={identityMap[identityIds[index]]}
                            onChange={v => setIdentityIds(p => p.map((x, i) => (i === index) ? (v ? v.value : null) : x))}
                            isClearable={true}
                            placeholder={"Select Identity"}
                            styles={selectStyle}
                            filterOption={(candidate, input) => candidate.data.name.toLowerCase().includes(input.toLowerCase())}
                            getOptionLabel={(option) => option.label}
                            formatOptionLabel={(option, { context }) => context === "menu" ? option.label : option.displayLabel}
                        />
                        <DeploymentComponent order={deploymentOrder} setOrder={setDeploymentOrder} activeSinners={activeSinners} sinnerId={index + 1} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {Array.from({ length: 5 }, (_, rank) =>
                            <Select
                                key={rank}
                                options={egoOptions[index + 1][rank]}
                                value={egoMap[egoIds[index][rank]]}
                                onChange={v => setEgoIds(p => p.map((x, i) => i === index ? x.map((y, r) => r === rank ? (v ? v.value : null) : y) : x))}
                                isClearable={true}
                                placeholder={"Select Ego"}
                                styles={selectStyle}
                                filterOption={(candidate, input) => candidate.data.name.toLowerCase().includes(input.toLowerCase())}
                                getOptionLabel={(option) => option.label}
                                formatOptionLabel={(option, { context }) => context === "menu" ? option.label : option.displayLabel}
                            />)}
                    </div>
                </div>)}
            </div>
        }
        <div style={{ display: "flex", gap: "0.5rem" }}>
            <span>Active Sinners</span>
            <ActiveSinnersInput value={activeSinners} setValue={setActiveSinners} />
            <button onClick={() => setDeploymentOrder([])}>Reset Deployment Order</button>
        </div>
        <span>Body</span>
        <div className={{ maxWidth: "48rem", marginLeft: "auto", marginRight: "auto" }}>
            <SimpleMDE value={body} onChange={setBody} options={mdeOptions} />
        </div>
        <span>Keywords</span>
        <div style={{ display: "flex", flexDirection: "row" }}>
            {keywordOptions.filter(x => keywordIds.includes(x))}
            {keywordOptions.filter(x => !keywordIds.includes(x))}
        </div>
        <span>Import String</span>
        <div className={{ maxWidth: "48rem", marginLeft: "auto", marginRight: "auto" }}>
            <input type="text" value={importString} onChange={e => setImportString(e.target.value)} />
        </div>
        <TagSelector value={tags} onChange={setTags} creatable={true} />
    </div>
}
