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
import { deleteCuratedList, getCuratedList } from "@/app/database/collections";
import BuildEntry from "@/app/components/BuildEntry";
import DropdownButton from "@/app/components/DropdownButton";
import CommentSection from "@/app/components/commentSection";
import LikeButton from "@/app/components/LikeButton";
import SaveButton from "@/app/components/SaveButton";
import ContributeButton from "@/app/components/ContributeButton";
import { isLocalId } from "@/app/utils";
import ReviewButton from "@/app/components/ReviewButton";

function BuildList({ builds, viewMode, isMobile }) {
    if (viewMode === "grid" || isMobile) {
        const size = isMobile ? "320px" : "480px";
        return <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${size}, 1fr))`, gap: "1rem" }}>
            {builds.map(build =>
                <div key={build.build.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center", width: "100%" }}>
                    <BuildEntry build={build.build} size={"M"} />
                    {build.submitted_by ?
                        <div style={{ display: "flex", gap: "0.2rem" }}>
                            Submitted by: <Username username={build.submitted_by_username} flair={build.submitted_by_flair} />
                        </div> :
                        null
                    }
                    {build.note.length > 0 ?
                        <div style={{ alignSelf: "center", marginTop: "0.5rem" }}>
                            <MarkdownRenderer content={build.note} />
                        </div> :
                        null
                    }
                </div>
            )}
        </div>
    } else if (viewMode === "detail") {
        return <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {builds.map(build =>
                <div key={build.build.id} style={{
                    display: "flex", flexDirection: isMobile ? "column" : "row",
                    gap: "1rem", alignItems: isMobile ? "center" : "start",
                    width: isMobile ? "320px" : "95%", alignSelf: "center"
                }}>
                    <BuildEntry build={build.build} size={"M"} />
                    {build.note.length > 0 ?
                        <div style={{
                            display: "flex", flexDirection: "column",
                            width: "100%", alignSelf: "start",
                            paddingTop: isMobile ? "0" : "1rem"
                        }}>
                            {build.submitted_by ?
                                <div style={{ display: "flex", gap: "0.2rem" }}>
                                    Submitted by: <Username username={build.submitted_by_username} flair={build.submitted_by_flair} />
                                </div> :
                                null
                            }
                            <MarkdownRenderer content={build.note} />
                        </div> :
                        null
                    }
                </div>
            )}
        </div>
    }
}

export default function CuratedListPage({ params }) {
    const { id } = React.use(params);
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState(null);
    const [curatedList, setCuratedList] = useState(null);
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
            const handleCuratedList = x => {
                setCuratedList(x);
                setLoading(false);
                setLikeCount(x.like_count);
                setCommentCount(x.comment_count);
                document.title = `${x.title} | Limbus Company Team Building Hub`;
            }

            if (isLocalId(id)) {
                listsStore.get(Number(id)).then(handleCuratedList);
            } else {
                getCuratedList(id).then(handleCuratedList);
            }
        }
    }, [id, loading]);

    useEffect(() => {
        const saved = localStorage.getItem("listsViewMode");
        setViewMode(saved ? JSON.parse(saved) : "detail");
    }, []);

    const handleSetViewMode = (mode) => {
        localStorage.setItem("listsViewMode", JSON.stringify(mode));
        setViewMode(mode);
    }

    const editList = () => {
        router.push(`/curated-lists/${id}/edit`);
    }

    const handleDeleteList = async () => {
        setDeleting(true);
        const data = await deleteCuratedList(id);
        if (data && data.deleted) {
            router.push(`/curated-lists`);
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
                    {curatedList.title}
                </h2>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "0.9rem", marginBottom: "0.5rem", color: "#ddd" }}>
                        {!isLocalId(id) ?
                            <span>by <Username username={curatedList.username} flair={curatedList.user_flair} /> • </span> :
                            null
                        }
                        <ReactTimeAgo date={curatedList.published_at ?? curatedList.created_at} locale="en-US" timeStyle="mini" />
                        {curatedList.updated_at !== (curatedList.published_at ?? curatedList.created_at) ?
                            <span> • Last edited <ReactTimeAgo date={curatedList.updated_at} locale="en-US" timeStyle="mini" /></span> :
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
                            <MarkdownRenderer content={curatedList.body} />
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

                <BuildList builds={curatedList.items} viewMode={viewMode} isMobile={isMobile} />

                <div style={{ border: "1px #777 solid" }} />

                <div style={{ display: "flex", flexDirection: "column", paddingLeft: "0.5rem", width: "100%", gap: "0.5rem" }}>
                    {curatedList.tags.length > 0 ?
                        <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                            Tags: {curatedList.tags.map((t, i) => <Tag key={i} tag={isLocalId(id) ? t : t.name} type={"curated-lists"} />)}
                        </div> :
                        null
                    }
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
                        <LikeButton targetType={"build_list"} targetId={id} likeCount={likeCount} />
                        <SaveButton targetType={"build_list"} targetId={id} />
                        {
                            (user && user.id === curatedList.user_id) || isLocalId(id) ?
                                <button onClick={editList}>
                                    <EditSolid text={"Edit"} />
                                </button> : null
                        }
                        {
                            user && user.id === curatedList.user_id ?
                                <button onClick={() => setDeleteOpen(true)}>
                                    <DeleteSolid text={"Delete"} />
                                </button> : null
                        }
                        {curatedList.submission_mode === "open" ? <ContributeButton listId={id} /> : null}
                        {user?.id === curatedList.user_id ? <ReviewButton listId={id} iconSize={20} /> : null}
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        {
                            user && user.id === curatedList.user_id ?
                                <div>
                                    <ViewSolid text={`${curatedList.view_count !== null ? curatedList.view_count.toLocaleString() :  "-"} views`} />
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

            {curatedList.is_published ?
                <div id="comments" style={{ width: "clamp(300px, 100%, 1200px)", alignSelf: "center" }}>
                    <CommentSection targetType={"build_list"} targetId={id} ownerId={curatedList.user_id} commentCount={commentCount} pinnedComment={curatedList.pinned_comment} />
                </div> :
                <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>No comments while the curated list is not published.</p>
            }

            <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
                    <span>Are you sure you want to delete this curated list?</span>
                    <span>This is a non-recoverable action.</span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => handleDeleteList()} disabled={deleting}>Yes</button>
                        <button onClick={() => setDeleteOpen(false)}>No</button>
                    </div>
                </div>
            </Modal>
        </div>
}
