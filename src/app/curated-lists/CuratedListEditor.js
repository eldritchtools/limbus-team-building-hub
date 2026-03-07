"use client";

import { useState, useEffect } from "react";
import TagSelector, { tagToTagSelectorOption } from "../components/TagSelector";
import { useAuth } from "../database/authProvider";
import { useRouter } from "next/navigation";
import MarkdownEditorWrapper from "../components/Markdown/MarkdownEditorWrapper";
import { listsStore } from "../database/localDB";
import { getCuratedList, insertCuratedList, updateCuratedList } from "../database/curatedLists";
import { Modal } from "../components/Modal";
import BuildsSearchComponent from "../builds/BuildsSearchComponent";
import { prepareBuildFilters } from "../builds/search/SearchBuildsContent";
import BuildEntry from "../components/BuildEntry";
import { tabStyle } from "../styles";
import { getFilteredBuilds } from "../database/builds";

function isLocalId(id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return !uuidRegex.test(id);
}

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
        <BuildEntry build={build} size={"M"} complete={false} clickable={false} />
        <div style={{ minWidth: "min(100ch, 90vw)", flex: 1, marginLeft: "auto", marginRight: "auto" }}>
            <MarkdownEditorWrapper value={note} onChange={setBuildNote} placeholder={"Add any notes for this build here..."} />
        </div>
    </div>
}

function BuildList({ builds, setBuilds, user }) {
    const [addBuildOpen, setAddBuildOpen] = useState(false);
    const [filters, setFilters] = useState({});
    const [searchBuilds, setSearchBuilds] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchMode, setSearchMode] = useState("search");

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

    useEffect(() => {
        const fetchBuilds = async () => {
            try {
                setLoading(true);

                if (searchMode === "search") {
                    const sortBy = filters["sortBy"] || "score";
                    const strictFiltering = filters["strictFiltering"] || false;
                    const newFilters = prepareBuildFilters(filters);

                    const data = await getFilteredBuilds({ ...newFilters, "ignore_block_discovery": true }, true, sortBy, strictFiltering, page, 24);

                    setSearchBuilds(data || []);
                } else if (searchMode === "user") {
                    if (user) {
                        const data = await getFilteredBuilds({ "user_id": user.id, "ignore_block_discovery": true }, true, "recency", false, page, 24);
                        setSearchBuilds(data || []);
                    }
                }
                setLoading(false);
            } catch (err) {
                console.error("Error loading builds:", err);
            }
        };

        fetchBuilds();

    }, [filters, page, setBuilds, searchMode, user]);

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
        <Modal isOpen={addBuildOpen} onClose={() => setAddBuildOpen(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem", maxHeight: "90vh", overflowY: "auto", width: "980px", maxWidth: "80vw" }}>
                <div style={{ display: "flex", flexDirection: "row", gap: "1rem", alignSelf: "center", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
                    <div style={{ ...tabStyle, color: searchMode === "search" ? "#ddd" : "#777" }} onClick={() => setSearchMode("search")}>Search Builds</div>
                    <div style={{ ...tabStyle, color: searchMode === "user" ? "#ddd" : "#777" }} onClick={() => setSearchMode("user")}>My Published Builds</div>
                </div>
                {searchMode === "search" ?
                    <BuildsSearchComponent inPage={true} setFilters={setFilters} /> :
                    (!user ?
                        <span>Locally saved builds are not supported.</span> :
                        null
                    )
                }
                <span style={{ textAlign: "center" }}>Adding the same build more than once is not supported.</span>
                <div style={{ border: "1px #777 solid" }} />

                {loading ?
                    <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>Loading builds...</p> :
                    searchBuilds.length === 0 ?
                        <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>
                            {page === 1 ? "No published builds yet." : "No more builds."}
                        </p> :
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 300px)", gap: "1rem", justifyContent: "center" }}>
                                {searchBuilds.map(build => <div key={build.id} onClick={() => {
                                    if (!builds.find(x => x.build.id === build.id)) {
                                        addBuild(build); setAddBuildOpen(false);
                                    }
                                }}>
                                    <BuildEntry build={build} size={"S"} complete={false} clickable={false} />
                                </div>
                                )}
                            </div>

                            <div style={{ display: "flex", gap: "0.5rem", alignSelf: "end" }}>
                                <button className="page-button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                                <button className="page-button" disabled={searchBuilds.length < 24} onClick={() => setPage(p => p + 1)}>Next</button>
                            </div>
                        </div>
                }
            </div>
        </Modal>
    </div>
}

export default function CuratedListEditor({ mode, listId }) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [shortDesc, setShortDesc] = useState('');
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
                console.log(list);
                if (!list) router.back();
                if (list.username || isLocalId(listId)) {
                    setTitle(list.title);
                    setBody(list.body);
                    setShortDesc(list.short_desc);
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
            const trimmedBuilds = builds.map(({ build, note }) => ({ build_id: build.id, note: note }));
            if (mode === "edit") {
                const data = await updateCuratedList(listId, title, body, shortDesc, trimmedBuilds, tagsConverted, blockDiscovery, isPublished);
                router.push(`/curated-lists/${data}`);
            } else {
                const data = await insertCuratedList(title, body, shortDesc, trimmedBuilds, tagsConverted, blockDiscovery, isPublished);
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
        <span style={{ fontSize: "1.2rem" }}>Builds</span>
        <BuildList builds={builds} setBuilds={setBuilds} user={user} />
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
