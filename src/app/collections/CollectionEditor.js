"use client";

import { useState, useEffect } from "react";
import TagSelector, { tagToTagSelectorOption } from "../components/TagSelector";
import { useAuth } from "../database/authProvider";
import { useRouter } from "next/navigation";
import MarkdownEditorWrapper from "../components/Markdown/MarkdownEditorWrapper";
import { listsStore } from "../database/localDB";
import { getCollection, insertCollection, updateCollection } from "../database/collections";
import BuildEntry from "../components/BuildEntry";
import Username from "../components/Username";
import SelectBuildModal from "../components/SelectBuildModal";
import { isLocalId } from "../utils";
import MdPlan from "../components/MdPlan";
import SelectMdPlanModal from "../components/SelectMdPlanModal";

function Item({ type, data, note, index, isFirst, isLast, swapItems, removeItem, setItemNote, username, flair }) {
    return <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", paddingRight: "1rem" }}>
            <button onClick={() => swapItems(index - 1)} disabled={isFirst}>∧</button>
            <button onClick={() => removeItem()}>
                <div style={{ color: "#ff4848", fontWeight: "bold" }}>
                    ✕
                </div>
            </button>
            <button onClick={() => swapItems(index + 1)} disabled={isLast}>∨</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
            {username ?
                <div style={{ display: "flex", gap: "0.2rem" }}>
                    Submitted by: <Username username={username} flair={flair} />
                </div> :
                null
            }
            {
                type === "build" ?
                    <BuildEntry build={data} size={"M"} complete={false} clickable={false} /> :
                    type === "md_plan" ?
                        <MdPlan plan={data} complete={false} clickable={false} /> :
                        null
            }
        </div>
        <div style={{ minWidth: "min(80ch, 90vw)" }}>
            <MarkdownEditorWrapper value={note} onChange={setItemNote} placeholder={"Add any notes for this item here..."} />
        </div>
    </div>
}

function ItemList({ items, setItems }) {
    const [addItemOpen, setAddItemOpen] = useState(false);
    const [addType, setAddType] = useState(null);

    const swapItems = (a, b) => {
        setItems(p => {
            const res = [...p];
            [res[a], res[b]] = [res[b], res[a]];
            return res;
        });
    };

    const addItem = (type, item) => {
        setItems(p => [...p, { type: type, data: item, note: "" }])
    };

    const removeItem = (id) => {
        setItems(p => p.filter(x => x.data.id !== id))
    };

    const setItemNote = (id, v) => {
        setItems(p => p.map(x => x.data.id === id ? { ...x, note: v } : x))
    }

    return <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex" }}>
            <button onClick={() => { setAddItemOpen(true); setAddType("build"); }}>
                Add Build
            </button>
            <button onClick={() => { setAddItemOpen(true); setAddType("plan"); }}>
                Add MD Plan
            </button>
        </div>
        {items.map((item, i) =>
            <Item
                key={item.data.id}
                type={item.type}
                data={item.data}
                note={item.note}
                index={i}
                isFirst={i === 0}
                isLast={i === items.length - 1}
                swapItems={x => swapItems(i, x)}
                removeItem={() => removeItem(item.data.id)}
                setItemNote={v => setItemNote(item.data.id, v)}
                username={item.submitted_by_username}
                flair={item.submitted_by_flair}
            />
        )}

        <SelectBuildModal
            isOpen={addItemOpen && addType === "build"}
            onClose={() => setAddItemOpen(false)}
            onSelectBuild={build => {
                if (!items.find(x => x.data.id === build.id)) {
                    addItem("build", build); setAddItemOpen(false);
                }
            }}
        />

        <SelectMdPlanModal
            isOpen={addItemOpen && addType === "plan"}
            onClose={() => setAddItemOpen(false)}
            onSelectMdPlan={plan => {
                if (!items.find(x => x.data.id === plan.id)) {
                    addItem("md_plan", plan); setAddItemOpen(false);
                }
            }}
        />
    </div>
}

export default function CollectionEditor({ mode, collectionId }) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [shortDesc, setShortDesc] = useState('');
    const [contributions, setContributions] = useState('closed');
    const [tags, setTags] = useState([]);
    const [items, setItems] = useState([]);
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
            const handleCollection = collection => {
                if (!collection) router.back();
                if (collection.username || isLocalId(collectionId)) {
                    setTitle(collection.title);
                    setBody(collection.body);
                    setShortDesc(collection.short_desc);
                    setContributions(collection.submission_mode);
                    setItems(collection.items.filter(x => x.data));
                    setTags(collection.tags.map(t => tagToTagSelectorOption(t?.name ?? t)));
                    setIsPublished(collection.is_published);
                    setBlockDiscovery(collection.block_discovery ?? false);
                    setLoading(false);

                    if (collection.created_at) setCreatedAt(collection.created_at);
                }
            }

            if (user)
                getCollection(collectionId).then(handleCollection).catch(_err => {
                    router.push(`/collections/${collectionId}`);
                });
            else
                listsStore.get(Number(collectionId)).then(handleCollection).catch(_err => {
                    router.push(`/collections/${collectionId}`);
                });
        }
    }, [mode, collectionId, router, user]);

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
            const trimmedItems = items.map(({ type, data, note, submitted_by }) => {
                const result = { target_type: type, target_id: data.id, note };
                if (submitted_by) result.submitted_by = submitted_by;
                return result;
            });
            if (mode === "edit") {
                const data = await updateCollection(collectionId, title, body, shortDesc, trimmedItems, contributions, tagsConverted, blockDiscovery, isPublished);
                router.push(`/collections/${data}`);
            } else {
                const data = await insertCollection(title, body, shortDesc, trimmedItems, contributions, tagsConverted, blockDiscovery, isPublished);
                router.push(`/collections/${data}`);
            }
        } else {
            const collectionData = {
                title: title,
                body: body,
                short_desc: shortDesc,
                items: items,
                tags: tagsConverted,
                block_discovery: blockDiscovery,
                like_count: 0,
                comment_count: 0,
                is_published: false,
                created_at: createdAt ?? Date.now(),
                updated_at: Date.now()
            }

            if (mode === "edit") collectionData.id = Number(collectionId);

            const data = await listsStore.save(collectionData)
            router.push(`/collections/${data}`);
        }
    }

    return loading ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: "1.5rem", fontWeight: "bold" }}>
        Loading...
    </div> : <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", containerType: "inline-size" }}>
        <h2 style={{ fontSize: "1.2rem", margin: 0 }}>
            {mode === "edit" ? "Editing" : "Creating"} Collection
        </h2>
        {!user ?
            <div style={{ color: "rgba(255, 99, 71, 0.85)" }}>When not logged in, collections are saved locally on this device. After logging in, you can sync them to your account. Collections that are not synced cannot be accessed while logged in.</div>
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
        {!isLocalId(collectionId) ? <>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.2rem" }}>Contributions: </span>
                <select value={contributions} onChange={e => setContributions(e.target.value)}>
                    <option value={"closed"}>Closed</option>
                    <option value={"open"}>Open</option>
                </select>
            </div>
            <span style={{ fontSize: "1rem", color: "#aaa" }}>
                Opening contributions allows other users to submit items which you can then review to add to your collection.
            </span>
        </> :
            null
        }
        <span style={{ fontSize: "1.2rem" }}>Items</span>
        <ItemList items={items} setItems={setItems} />
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
