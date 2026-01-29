"use client";

import Tag from "@/app/components/Tag";
import { deleteBuild, getBuild } from "@/app/database/builds";
import { KeywordIcon } from "@eldritchtools/limbus-shared-library";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/database/authProvider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Modal } from "@/app/components/Modal";
import { keywordIdMapping } from "@/app/keywordIds";
import Username from "@/app/components/Username";
import CommentSection from "./commentSection";
import SinnerGrid from "../SinnerGrid";

import "./builds.css";
import MarkdownRenderer from "@/app/components/Markdown/MarkdownRenderer";
import ImageStitcher from "@/app/components/ImageStitcher";
import LikeButton from "@/app/components/LikeButton";
import SaveButton from "@/app/components/SaveButton";
import { YouTubeThumbnailEmbed } from "@/app/YoutubeUtils";
import ReactTimeAgo from "react-time-ago";
import { decodeBuildExtraOpts } from "@/app/components/BuildExtraOpts";
import { generalTooltipProps } from "@/app/components/GeneralTooltip";
import { useBreakpoint } from "@eldritchtools/shared-components";
import DisplayTypeButton from "../DisplayTypeButton";
import { buildsStore } from "@/app/database/localDB";
import { DeleteSolid, EditSolid, ShareSolid } from "@/app/components/Symbols";
import SinDistribution from "@/app/components/SinDistribution";
import SocialsDisplay from "@/app/components/SocialsDisplay";

function isLocalId(id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return !uuidRegex.test(id);
}

export default function BuildPage({ params }) {
    const { id } = React.use(params);
    const { user } = useAuth();
    const [build, setBuild] = useState(null);
    const [loading, setLoading] = useState(true);
    const teamCodeRef = useRef(null);
    const [copySuccess, setCopySuccess] = useState('');
    const [likeCount, setLikeCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);
    const router = useRouter();
    const [shareOpen, setShareOpen] = useState(false);
    const [linkCopySuccess, setLinkCopySuccess] = useState('');
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [identityLevels, setIdentityLevels] = useState(null);
    const [identityUpties, setIdentityUpties] = useState(null);
    const [egoThreadspins, setEgoThreadspins] = useState(null);
    const { isDesktop } = useBreakpoint();

    const [displayType, setDisplayType] = useState(null);
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
        const savedType = localStorage.getItem("buildDisplayType");
        if (["0", "1", "2"].includes(savedType)) setDisplayType("names");
        else if (savedType) setDisplayType(savedType);
        else setDisplayType("names");
    }, [])

    useEffect(() => {
        if (displayType !== null) localStorage.setItem("buildDisplayType", displayType);
    }, [displayType]);

    useEffect(() => {
        if (loading) {
            const handleBuild = x => {
                setBuild(x);
                if (x.extra_opts) {
                    const extraOpts = decodeBuildExtraOpts(x.extra_opts);
                    if (extraOpts.identityLevels) setIdentityLevels(extraOpts.identityLevels);
                    if (extraOpts.identityUpties) setIdentityUpties(extraOpts.identityUpties);
                    if (extraOpts.egoThreadspins) setEgoThreadspins(extraOpts.egoThreadspins);
                }
                setLoading(false);
                setLikeCount(x.like_count);
                setCommentCount(x.comment_count);
                document.title = `${x.title} | Limbus Company Team Building Hub`;
            }

            if (isLocalId(id)) {
                buildsStore.get(Number(id)).then(handleBuild);
            } else {
                getBuild(id).then(handleBuild);
            }
        }
    }, [id, loading]);

    const handleTeamCodeCopy = async () => {
        if (teamCodeRef.current) {
            try {
                await navigator.clipboard.writeText(teamCodeRef.current.value);
                setCopySuccess('Copied!');
                setTimeout(() => setCopySuccess(''), 2000);
            } catch (err) {
                setCopySuccess('Failed to copy!');
                setTimeout(() => setCopySuccess(''), 2000);
                console.error('Failed to copy text: ', err);
            }
        }
    };

    const handleLinkCopy = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setLinkCopySuccess('Copied!');
            setTimeout(() => setLinkCopySuccess(''), 2000);
        } catch (err) {
            setLinkCopySuccess('Failed to copy!');
            setTimeout(() => setLinkCopySuccess(''), 2000);
            console.error('Failed to copy text: ', err);
        }
    };

    const editBuild = () => {
        router.push(`/builds/${id}/edit`);
    }

    const handleDeleteBuild = async () => {
        setDeleting(true);
        const data = await deleteBuild(id);
        if (data && data.deleted) {
            router.push(`/builds`);
        }
        setDeleting(false);
    }

    return loading ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: "1.5rem", fontWeight: "bold" }}>
        Loading...
    </div> : <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", containerType: "inline-size" }}>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <h2 style={{ display: "flex", fontSize: "1.2rem", fontWeight: "bold", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "0.2rem" }}>
                    {build.keyword_ids.map(id => <KeywordIcon key={id} id={keywordIdMapping[id]} />)}
                </div>
                {build.title}
            </h2>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "0.9rem", marginBottom: "0.5rem", color: "#ddd" }}>
                    {!isLocalId(id) ?
                        <span>by <Username username={build.username} flair={build.user_flair} /> • </span> :
                        null
                    }
                    <ReactTimeAgo date={build.published_at ?? build.created_at} locale="en-US" timeStyle="mini" />
                    {build.updated_at !== (build.published_at ?? build.created_at) ?
                        <span> • Last edited <ReactTimeAgo date={build.updated_at} locale="en-US" timeStyle="mini" /></span> :
                        null}
                </div>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", justifyContent: "center", gap: "0.2rem" }}>
                    <div>Display Type</div>
                    <DisplayTypeButton value={displayType} setValue={setDisplayType} />
                </div>
            </div>
        </div>

        <SinnerGrid
            identityIds={build.identity_ids}
            egoIds={build.ego_ids}
            identityUpties={identityUpties}
            identityLevels={identityLevels}
            egoThreadspins={egoThreadspins}
            deploymentOrder={build.deployment_order}
            activeSinners={build.active_sinners}
            displayType={displayType}
        />

        <div style={{ height: "0.5rem" }} />
        <div style={{ display: "flex", flexDirection: isDesktop ? "row" : "column", width: isDesktop ? "95%" : "100%", alignSelf: "center", marginBottom: "1rem", gap: isDesktop ? 0 : "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", paddingRight: "0.5rem", gap: "0.5rem", width: isDesktop ? "70%" : "100%" }}>
                <span style={{ fontSize: "1.2rem" }}>Description</span>
                <div className={{ maxWidth: "48rem", marginLeft: "auto", marginRight: "auto" }}>
                    <div>
                        <MarkdownRenderer content={build.body} />
                    </div>
                </div>
                {build.youtube_video_id ? <div style={{ display: "flex", paddingTop: "1rem", alignSelf: "center", width: "100%", justifyContent: "center" }}>
                    <YouTubeThumbnailEmbed videoId={build.youtube_video_id} />
                </div> : null}
            </div>

            <div style={{ border: "1px #777 solid" }} />

            <div style={{ display: "flex", flexDirection: "column", paddingLeft: "0.5rem", width: isDesktop ? "30%" : "100%", gap: "0.5rem" }}>
                <div style={{ display: "flex" }}>
                    <SinDistribution
                        identityIds={build.identity_ids}
                        identityUpties={identityUpties}
                        deploymentOrder={build.deployment_order}
                        activeSinners={build.active_sinners}
                        alignment="start"
                    />
                </div>
                {build.team_code.trim().length > 0 ? <>
                    <div>
                        <span style={{ fontSize: "1.2rem", borderBottom: "1px #ddd dotted" }} {...generalTooltipProps("teamcode")}>Team Code</span>
                    </div>
                    <div style={{ position: "relative", width: "100%" }}>
                        <textarea value={build.team_code} ref={teamCodeRef} readOnly={true} style={{ width: "100%", height: "3rem", cursor: "pointer" }} onClick={handleTeamCodeCopy} />
                        {copySuccess !== '' ?
                            <div className="copy-popup">
                                <div className="copy-popup-box">
                                    {copySuccess}
                                </div>
                            </div> :
                            null
                        }
                    </div>
                </> : null
                }
                {build.tags.length > 0 ?
                    <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        Tags: {build.tags.map((t, i) => <Tag key={i} tag={isLocalId(id) ? t : t.name} />)}
                    </div> :
                    null
                }
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
                    <LikeButton buildId={id} likeCount={likeCount} />
                    <SaveButton buildId={id} />
                    <button onClick={() => setShareOpen(true)}>
                        <ShareSolid text={"Share"} />
                    </button>
                    {
                        (user && user.id === build.user_id) || isLocalId(id) ?
                            <button onClick={editBuild}>
                                <EditSolid text={"Edit"} />
                            </button> : null
                    }
                    {
                        user && user.id === build.user_id ?
                            <button onClick={() => setDeleteOpen(true)}>
                                <DeleteSolid text={"Delete"} />
                            </button> : null
                    }
                </div>
                {build.user_socials.length > 0 ?
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "start", gap: "0.25rem" }}>
                        <span>Connect with {build.username}:</span>
                        <SocialsDisplay socials={build.user_socials} expandDirection="column" align="start" />
                    </div> :
                    null
                }
            </div>
        </div>

        <div style={{ border: "1px #777 solid" }} />
        {build.is_published ?
            <div id="comments" style={{ width: "clamp(300px, 100%, 1200px)", alignSelf: "center" }}>
                <CommentSection buildId={id} ownerId={build.user_id} commentCount={commentCount} pinnedComment={build.pinned_comment} />
            </div> :
            <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>No comments while the build is not published.</p>
        }
        <Modal isOpen={shareOpen} onClose={() => setShareOpen(false)}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem", padding: "0.5rem" }}>
                {!isLocalId(id) ?
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", alignSelf: "start", flexWrap: "wrap" }}>
                        Address (click to copy):
                        <div style={{ position: "relative" }}>
                            <input value={window.location.href} onClick={handleLinkCopy} readOnly={true} style={{ minWidth: "20rem" }} />
                            {linkCopySuccess !== '' ?
                                <div className="copy-popup">
                                    <div className="copy-popup-box">
                                        {linkCopySuccess}
                                    </div>
                                </div> :
                                null
                            }
                        </div>
                    </div> : null
                }
                <ImageStitcher build={build} outputFileName={`${build.id}.png`} />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => setShareOpen(false)}>Close</button>
                </div>
            </div>
        </Modal>
        <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
                <span>Are you sure you want to delete this build?</span>
                <span>This is a non-recoverable action.</span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => handleDeleteBuild()} disabled={deleting}>Yes</button>
                    <button onClick={() => setDeleteOpen(false)}>No</button>
                </div>
            </div>
        </Modal>
    </div>
}
