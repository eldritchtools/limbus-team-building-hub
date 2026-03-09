"use client";

import { useState, useEffect } from "react";
import TagSelector, { tagToTagSelectorOption } from "../components/TagSelector";
import { useAuth } from "../database/authProvider";
import { useRouter } from "next/navigation";
import MarkdownEditorWrapper from "../components/Markdown/MarkdownEditorWrapper";
import { listsStore } from "../database/localDB";
import { getCuratedList, insertCuratedList, updateCuratedList } from "../database/curatedLists";
import BuildEntry from "../components/BuildEntry";
import Username from "../components/Username";
import SelectBuildModal from "../components/SelectBuildModal";
import { isLocalId } from "../utils";

function BuildItem({ build, note, index, isFirst, isLast, swapBuilds, removeBuild, setBuildNote }) {
    return <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", paddingRight: "1rem" }}>
            <button onClick={() => swapBuilds(index - 1)} disabled={isFirst}>∧</button>
            <button onClick={() => removeBuild()}>
                <div style={{ color: "#ff4848", fontWeight: "bold" }}>
                    ✕
                </div>
            </button>
            <button onClick={() => swapBuilds(index + 1)} disabled={isLast}>∨</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
            {build.submitted_by ?
                <div style={{ display: "flex" }}>
                    Submitted by: <Username username={build.submitted_by_username} flair={build.submitted_by_flair} />
                </div> :
                null
            }
            <BuildEntry build={build} size={"M"} complete={false} clickable={false} />
        </div>
        <div style={{ minWidth: "min(100ch, 90vw)", flex: 1, marginLeft: "auto", marginRight: "auto" }}>
            <MarkdownEditorWrapper value={note} onChange={setBuildNote} placeholder={"Add any notes for this build here..."} />
        </div>
    </div>
}

function BuildList({ builds, setBuilds }) {
    const [addBuildOpen, setAddBuildOpen] = useState(false);

    const swapBuilds = (a, b) => {
        setBuilds(p => {
            const res = [...p];
            [res[a], res[b]] = [res[b], res[a]];
            return res;
        });
    };
    // p.map((x, i) => i === a ? p[b] : (i === b ? p[a] : x)))

    const addBuild = (build) => {
        setBuilds(p => [...p, { build: build, note: "" }])
    };

    const removeBuild = (id) => {
        setBuilds(p => p.filter(x => x.build.id !== id))
    };

    const setBuildNote = (id, v) => {
        setBuilds(p => p.map(x => x.build.id === id ? { ...x, note: v } : x))
    }

    return <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div>
            <button onClick={() => { setAddBuildOpen(true); }}>
                Add Build
            </button>
        </div>
        {builds.map((build, i) =>
            <BuildItem
                key={build.build.id}
                build={build.build}
                note={build.note}
                index={i}
                isFirst={i === 0}
                isLast={i === builds.length - 1}
                swapBuilds={x => swapBuilds(i, x)}
                removeBuild={() => removeBuild(build.build.id)}
                setBuildNote={v => setBuildNote(build.build.id, v)}
            />
        )}

        <SelectBuildModal
            isOpen={addBuildOpen}
            onClose={() => setAddBuildOpen(false)}
            onSelectBuild={build => {
                if (!builds.find(x => x.build.id === build.id)) {
                    addBuild(build); setAddBuildOpen(false);
                }
            }}
        />
    </div>
}

export default function CuratedListEditor({ mode, listId }) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [shortDesc, setShortDesc] = useState('');
    const [contributions, setContributions] = useState('closed');
    const [tags, setTags] = useState([]);
    const [builds, setBuilds] = useState([]);
    const [isPublished, setIsPublished] = useState(false);
    const [otherSettings, setOtherSettings] = useState(false);
    const [blockDiscovery, setBlockDiscovery] = useState(false);
    const [loading, setLoading] = useState(mode === "edit");
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [createdAt, setCreatedAt] = useState(null);
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (mode === "edit") {
            const handleList = list => {
                if (!list) router.back();
                if (list.username || isLocalId(listId)) {
                    setTitle(list.title);
                    setBody(list.body);
                    setShortDesc(list.short_desc);
                    setContributions(list.submission_mode);
                    setBuilds(list.items);
                    setTags(list.tags.map(t => tagToTagSelectorOption(t?.name ?? t)));
                    setIsPublished(list.is_published);
                    setBlockDiscovery(list.block_discovery ?? false);
                    setLoading(false);

                    if (list.created_at) setCreatedAt(list.created_at);
                }
            }

            if (user)
                getCuratedList(listId).then(handleList).catch(_err => {
                    router.push(`/curated-lists/${listId}`);
                });
            else
                listsStore.get(Number(listId)).then(handleList).catch(_err => {
                    router.push(`/curated-lists/${listId}`);
                });
        }
    }, [mode, listId, router, user]);

    const handleSave = async (isPublished) => {
        if (title === "") {
            setMessage("Title is required.")
            return;
        }

        if (title.length < 3 || title.length > 100) {
            setMessage("Title must be between 3-100 characters.");
            return;
        }

        const tagsConverted = tags.map(t => t.value);

        setSaving(true);
        if (user) {
            const trimmedBuilds = builds.map(({ build, note, submitted_by }) => {
                const result = { build_id: build.id, note };
                if (submitted_by) result.submitted_by = submitted_by;
                return result;
            });
            if (mode === "edit") {
                const data = await updateCuratedList(listId, title, body, shortDesc, trimmedBuilds, contributions, tagsConverted, blockDiscovery, isPublished);
                router.push(`/curated-lists/${data}`);
            } else {
                const data = await insertCuratedList(title, body, shortDesc, trimmedBuilds, contributions, tagsConverted, blockDiscovery, isPublished);
                router.push(`/curated-lists/${data}`);
            }
        } else {
            const listData = {
                title: title,
                body: body,
                short_desc: shortDesc,
                items: builds,
                tags: tagsConverted,
                block_discovery: blockDiscovery,
                is_published: false,
                created_at: createdAt ?? Date.now(),
                updated_at: Date.now()
            }

            if (mode === "edit") listData.id = Number(listId);

            const data = await listsStore.save(listData)
            router.push(`/curated-lists/${data}`);
        }
    }

    return loading ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: "1.5rem", fontWeight: "bold" }}>
        Loading...
    </div> : <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", containerType: "inline-size" }}>
        <h2 style={{ fontSize: "1.2rem", margin: 0 }}>
            {mode === "edit" ? "Editing" : "Creating"} Curated List
        </h2>
        {!user ?
            <div style={{ color: "rgba(255, 99, 71, 0.85)" }}>When not logged in, curated lists are saved locally on this device. After logging in, you can sync them to your account. Curated lists that are not synced cannot be accessed while logged in.</div>
            : null
        }
        <span style={{ fontSize: "1.2rem" }}>Title</span>
        <input type="text" value={title} style={{ width: "clamp(20ch, 80%, 100ch)" }} onChange={e => setTitle(e.target.value)} />
        <span style={{ fontSize: "1.2rem" }}>Short Description</span>
        <span style={{ fontSize: "1rem", color: "#aaa" }}>
            This will be displayed in place of the full description when the curated list is displayed on search or discovery results.
        </span>
        <input type="text" value={shortDesc} style={{ width: "clamp(20ch, 80%, 100ch)" }} onChange={e => setShortDesc(e.target.value)} />
        <span style={{ fontSize: "1.2rem" }}>Description</span>
        <div className={{ maxWidth: "48rem", marginLeft: "auto", marginRight: "auto" }}>
            <MarkdownEditorWrapper value={body} onChange={setBody} placeholder={"Describe your curated list here..."} />
        </div>
        {!isLocalId(listId) ? <>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.2rem" }}>Contributions: </span>
                <select value={contributions} onChange={e => setContributions(e.target.value)}>
                    <option value={"closed"}>Closed</option>
                    <option value={"open"}>Open</option>
                </select>
            </div>
            <span style={{ fontSize: "1rem", color: "#aaa" }}>
                Opening contributions allows other users to submit builds which you can then review to add to your curated list.
            </span>
        </> :
            null
        }
        <span style={{ fontSize: "1.2rem" }}>Builds</span>
        <BuildList builds={builds} setBuilds={setBuilds} />
        <span style={{ fontSize: "1.2rem" }}>Tags</span>
        <TagSelector selected={tags} onChange={setTags} creatable={true} />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div>
                <button className={otherSettings ? "toggle-button-active" : "toggle-button"} onClick={() => setOtherSettings(p => !p)}>
                    Other Settings
                </button>
            </div>
            {otherSettings ?
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <div style={{ fontSize: "0.8rem", color: "#aaa" }}>
                        Hide from discovery related features (popular, new, random, etc). Can still be found via search or on profiles.
                    </div>
                    <label style={{ display: "flex", alignItems: "center" }}>
                        <input type="checkbox" checked={blockDiscovery} onChange={e => setBlockDiscovery(e.target.checked)} />
                        <div>Block Discovery</div>
                    </label>
                </div> :
                null
            }
        </div>
        {user && !isPublished ?
            <div style={{ color: "#aaa" }}>
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
