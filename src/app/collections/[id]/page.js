"use client";

import Tag from "@/app/components/Tag";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/database/authProvider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Modal } from "@/app/components/Modal";
import Username from "@/app/components/Username";

import MarkdownRenderer from "@/app/components/Markdown/MarkdownRenderer";
import ReactTimeAgo from "react-time-ago";
import { useBreakpoint } from "@eldritchtools/shared-components";
import { listsStore } from "@/app/database/localDB";
import { DeleteSolid, EditSolid, ViewSolid } from "@/app/components/Symbols";
// import SocialsDisplay from "@/app/components/SocialsDisplay";
import { deleteCollection, getCollection } from "@/app/database/collections";
import BuildEntry from "@/app/components/BuildEntry";
import DropdownButton from "@/app/components/DropdownButton";
import CommentSection from "@/app/components/commentSection";
import LikeButton from "@/app/components/LikeButton";
import SaveButton from "@/app/components/SaveButton";
import ContributeButton from "@/app/components/ContributeButton";
import { isLocalId } from "@/app/utils";
import ReviewButton from "@/app/components/ReviewButton";
import MdPlan from "@/app/components/MdPlan";

function ItemList({ items, viewMode, isMobile }) {
    if (viewMode === "grid" || isMobile) {
        const size = isMobile ? "320px" : "480px";
        return <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${size}, 1fr))`, gap: "1rem" }}>
            {items.map(item =>
                <div key={item.data.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center", width: "100%" }}>
                    {item.type === "build" ?
                        <BuildEntry build={item.data} size={"M"} /> :
                        item.type === "md_plan" ?
                            <MdPlan plan={item.data} /> :
                            null
                    }
                    {item.submitted_by ?
                        <div style={{ display: "flex", gap: "0.2rem" }}>
                            Submitted by: <Username username={item.submitted_by_username} flair={item.submitted_by_flair} />
                        </div> :
                        null
                    }
                    {item.note.length > 0 ?
                        <div style={{ alignSelf: "center", marginTop: "0.5rem" }}>
                            <MarkdownRenderer content={item.note} />
                        </div> :
                        null
                    }
                </div>
            )}
        </div>
    } else if (viewMode === "detail") {
        return <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {items.map(item =>
                <div key={item.data.id} style={{
                    display: "flex", flexDirection: isMobile ? "column" : "row",
                    gap: "1rem", alignItems: isMobile ? "center" : "start",
                    width: isMobile ? "320px" : "95%", alignSelf: "center"
                }}>
                    {item.type === "build" ?
                        <BuildEntry build={item.data} size={"M"} /> :
                        item.type === "md_plan" ?
                            <MdPlan plan={item.data} /> :
                            null
                    }
                    {item.note.length > 0 ?
                        <div style={{
                            display: "flex", flexDirection: "column",
                            width: "100%", alignSelf: "start",
                            paddingTop: isMobile ? "0" : "1rem"
                        }}>
                            {item.submitted_by ?
                                <div style={{ display: "flex", gap: "0.2rem" }}>
                                    Submitted by: <Username username={item.submitted_by_username} flair={item.submitted_by_flair} />
                                </div> :
                                null
                            }
                            <MarkdownRenderer content={item.note} />
                        </div> :
                        null
                    }
                </div>
            )}
        </div>
    }
}

export default function CollectionPage({ params }) {
    const { id } = React.use(params);
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState(null);
    const [collection, setCollection] = useState(null);
    const [likeCount, setLikeCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const router = useRouter();
    const { isMobile } = useBreakpoint();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!loading && pathname && searchParams) {
            const hash = window.location.hash?.substring(1);
            if (!hash) return;

            const el = document.getElementById(hash);
            if (el) {
                setTimeout(() => {
                    const y = el.getBoundingClientRect().top + window.pageYOffset - 48;
                    window.scrollTo({ top: y, behavior: 'smooth' })
                }, 200);
            }
        }
    }, [loading, pathname, searchParams]);

    useEffect(() => {
        if (loading) {
            const handleCollection = x => {
                setCollection(x);
                setLoading(false);
                setLikeCount(x.like_count);
                setCommentCount(x.comment_count);
                document.title = `${x.title} | Limbus Company Team Building Hub`;
            }

            if (isLocalId(id)) {
                listsStore.get(Number(id)).then(handleCollection);
            } else {
                getCollection(id).then(handleCollection);
            }
        }
    }, [id, loading]);

    useEffect(() => {
        const saved = localStorage.getItem("collectionsViewMode");
        setViewMode(saved ? JSON.parse(saved) : "detail");
    }, []);

    const handleSetViewMode = (mode) => {
        localStorage.setItem("collectionsViewMode", JSON.stringify(mode));
        setViewMode(mode);
    }

    const editCollection = () => {
        router.push(`/collections/${id}/edit`);
    }

    const handleDeleteCollection = async () => {
        setDeleting(true);
        if (isLocalId(id)) {
            await listsStore.remove(Number(id));
            router.push(`/my-profile`);
        } else {
            const data = await deleteCollection(id);
            if (data && data.deleted) {
                router.push(`/collections`);
            }
        }
        setDeleting(false);
    }

    return loading || viewMode === null ?
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: "1.5rem", fontWeight: "bold" }}>
            Loading...
        </div> :
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", containerType: "inline-size" }}>
            <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                <h2 style={{ display: "flex", fontSize: "1.2rem", fontWeight: "bold", alignItems: "center" }}>
                    {collection.title}
                </h2>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "0.9rem", marginBottom: "0.5rem", color: "#ddd" }}>
                        {!isLocalId(id) ?
                            <span>by <Username username={collection.username} flair={collection.user_flair} /> • </span> :
                            null
                        }
                        <ReactTimeAgo date={collection.published_at ?? collection.created_at} locale="en-US" timeStyle="mini" />
                        {collection.updated_at !== (collection.published_at ?? collection.created_at) ?
                            <span> • Last edited <ReactTimeAgo date={collection.updated_at} locale="en-US" timeStyle="mini" /></span> :
                            null}
                    </div>
                </div>
            </div>

            <div style={{ height: "0.5rem" }} />
            <div style={{ display: "flex", flexDirection: "column", width: isMobile ? "100%" : "95%", alignSelf: "center", marginBottom: "1rem", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", paddingRight: "0.5rem", gap: "0.5rem", width: "100%" }}>
                    <span style={{ fontSize: "1.2rem" }}>Description</span>
                    <div className={{ maxWidth: "48rem", marginLeft: "auto", marginRight: "auto" }}>
                        <div>
                            <MarkdownRenderer content={collection.body} />
                        </div>
                    </div>
                </div>

                <div style={{ border: "1px #777 solid" }} />

                {isMobile ? null :
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        View Mode:
                        <DropdownButton value={viewMode} setValue={handleSetViewMode} options={{ "detail": "Detailed", "grid": "Grid" }} />
                    </div>
                }

                <ItemList items={collection.items.filter(x => x.data)} viewMode={viewMode} isMobile={isMobile} />

                <div style={{ border: "1px #777 solid" }} />

                <div style={{ display: "flex", flexDirection: "column", paddingLeft: "0.5rem", width: "100%", gap: "0.5rem" }}>
                    {collection.tags.length > 0 ?
                        <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                            Tags: {collection.tags.map((t, i) => <Tag key={i} tag={isLocalId(id) ? t : t.name} type={"collections"} />)}
                        </div> :
                        null
                    }
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
                        <LikeButton targetType={"collection"} targetId={id} likeCount={likeCount} />
                        <SaveButton targetType={"collection"} targetId={id} />
                        {
                            (user && user.id === collection.user_id) || isLocalId(id) ?
                                <button onClick={editCollection}>
                                    <EditSolid text={"Edit"} />
                                </button> : null
                        }
                        {
                            (user && user.id === collection.user_id) || isLocalId(id) ?
                                <button onClick={() => setDeleteOpen(true)}>
                                    <DeleteSolid text={"Delete"} />
                                </button> : null
                        }
                        {collection.submission_mode === "open" ? <ContributeButton collectionId={id} /> : null}
                        {user?.id === collection.user_id ? <ReviewButton collectionId={id} iconSize={20} /> : null}
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        {
                            user && user.id === collection.user_id ?
                                <div>
                                    <ViewSolid text={`${collection.view_count !== null ? collection.view_count.toLocaleString() : "-"} views`} />
                                </div>
                                : null
                        }
                    </div>
                    {/* {build.user_socials?.length > 0 ?
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "start", gap: "0.25rem" }}>
                        <span>Connect with {build.username}:</span>
                        <SocialsDisplay socials={build.user_socials} expandDirection="column" align="start" />
                    </div> :
                    null
                } */}
                </div>
            </div>

            <div style={{ border: "1px #777 solid" }} />

            {collection.is_published ?
                <div id="comments" style={{ width: "clamp(300px, 100%, 1200px)", alignSelf: "center" }}>
                    <CommentSection targetType={"collection"} targetId={id} ownerId={collection.user_id} commentCount={commentCount} pinnedComment={collection.pinned_comment} />
                </div> :
                <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>No comments while the collection is not published.</p>
            }

            <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
                    <span>Are you sure you want to delete this collection?</span>
                    <span>This is a non-recoverable action.</span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => handleDeleteCollection()} disabled={deleting}>Yes</button>
                        <button onClick={() => setDeleteOpen(false)}>No</button>
                    </div>
                </div>
            </Modal>
        </div>
}
