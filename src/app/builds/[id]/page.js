"use client";

import Tag from "@/app/components/Tag";
import { deleteBuild, getBuild } from "@/app/database/builds";
import { affinityColorMapping, useTimeAgo } from "@/app/utils";
import { EgoImg, Icon, IdentityImg, KeywordIcon, SinnerIcon, useData } from "@eldritchtools/limbus-shared-library";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/database/authProvider";
import { useRouter } from "next/navigation";
import { Modal } from "@/app/components/Modal";
import { keywordIconConvert, keywordIdMapping } from "@/app/keywordIds";
import Username from "@/app/components/Username";
import CommentSection from "./commentSection";
import Link from "next/link";

import "./builds.css";
import "@/app/components/SinnerGrid.css"
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import ImageStitcher from "@/app/components/ImageStitcher";
import LikeButton from "@/app/components/LikeButton";
import SaveButton from "@/app/components/SaveButton";

function SkillTypes({ skillType }) {
    return <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.2rem" }}>
        <Icon path={skillType.affinity} style={{ height: "40px" }} />
        <Icon path={keywordIconConvert(skillType.type)} style={{ height: "40px" }} />
        {skillType.type === "counter" ? <Icon path={keywordIconConvert(skillType.atkType)} style={{ height: "40px" }} /> : null}
    </div>
}


function IdentityProfile({ identity, displayType }) {
    return identity && displayType !== null ? <Link href={`/identities/${identity.id}`}>
        <div style={{ position: "relative", width: "100%" }} data-tooltip-id="identity-tooltip" data-tooltip-content={identity.id}>
            <IdentityImg identity={identity} uptie={4} displayName={false} width={"100%"} />
            {displayType === 1 ? <div style={{
                position: "absolute",
                bottom: "5px",
                right: "5px",
                textAlign: "right",
                textWrap: "balance",
                textShadow: "1px 1px 4px #000, -1px 1px 4px #000, 1px -1px 4px #000, -1px -1px 4px #000, 0px 0px 8px rgba(0, 0, 0, 0.5), 0px 0px 12px rgba(0, 0, 0, 0.25)",
                color: "#ddd"
            }}>
                {identity.name}
            </div> : null}
            {displayType === 2 ? <div style={{ position: "absolute", width: "100%", aspectRatio: "1/1", background: "rgba(0, 0, 0, 0.65)", top: 0, left: 0 }}>
                <div style={{ display: "grid", gridTemplateRows: "repeat(4, 1fr)", width: "100%", height: "100%", justifyContent: "center" }}>
                    {[0, 1, 2].map(x => <div key={x} style={{ display: "flex", justifyContent: "center" }}><SkillTypes skillType={identity.skillTypes[x].type} /></div>)}
                    {<SkillTypes key={3} skillType={identity.defenseSkillTypes[0].type} />}
                </div>
            </div>
                : null
            }
        </div>
    </Link > : <div style={{ width: "100%", aspectRatio: "1/1", boxSizing: "border-box" }} />
}

function EgoProfile({ ego, displayType }) {
    return ego && displayType !== null ? <Link href={`/egos/${ego.id}`}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", aspectRatio: "4/1" }} data-tooltip-id="ego-tooltip" data-tooltip-content={ego.id}>
            <EgoImg ego={ego} type={"awaken"} displayName={false} style={{ display: "block", width: "100%", height: null, aspectRatio: "4/1", objectFit: "cover" }} />
            {displayType === 1 ? <div style={{
                position: "absolute",
                fontSize: "0.75rem",
                color: affinityColorMapping[ego.awakeningType.affinity],
                maxHeight: "100%",
                overflow: "hidden",
                textWrap: "balance",
                textAlign: "center",
                textShadow: "1px 1px 4px #000, -1px 1px 4px #000, 1px -1px 4px #000, -1px -1px 4px #000, 0px 0px 8px rgba(0, 0, 0, 0.5), 0px 0px 12px rgba(0, 0, 0, 0.25)"
            }}>
                {ego.name}
            </div> : null}
            {displayType === 2 ? <div style={{ position: "absolute", width: "100%", aspectRatio: "4/1", background: "rgba(0, 0, 0, 0.65)", top: 0, left: 0 }}>
                <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
                    <SkillTypes skillType={ego.awakeningType} />
                </div>
            </div>
                : null
            }
        </div>
    </Link> : <div style={{ width: "100%", aspectRatio: "4/1", boxSizing: "border-box" }} />
}

const deploymentComponentStyle = {
    flex: 1,
    fontSize: "1.5rem",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
}

function DeploymentComponent({ order, activeSinners, sinnerId }) {
    const index = order.findIndex(x => x === sinnerId);
    if (index === -1) {
        return <div style={deploymentComponentStyle}></div>
    } else if (index < activeSinners) {
        return <div style={{ ...deploymentComponentStyle, color: "#fefe3d" }}>Active {index + 1}</div>
    } else {
        return <div style={{ ...deploymentComponentStyle, color: "#29fee9" }}>Backup {index + 1 - activeSinners}</div>
    }
}

export default function BuildPage({ params }) {
    const { id } = React.use(params);
    const { user } = useAuth();
    const [build, setBuild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [identities, identitiesLoading] = useData("identities");
    const [egos, egosLoading] = useData("egos");
    const createdTimeAgo = useTimeAgo(build ? build.created_at : null);
    const modifiedTimeAgo = useTimeAgo(build && build.updated_at !== build.created_at ? build.updated_at : null);
    const teamCodeRef = useRef(null);
    const [copySuccess, setCopySuccess] = useState('');
    const [likeCount, setLikeCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);
    const router = useRouter();
    const [shareOpen, setShareOpen] = useState(false);
    const [linkCopySuccess, setLinkCopySuccess] = useState('');
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [displayType, setDisplayType] = useState(null);

    useEffect(() => {
        const savedType = localStorage.getItem("buildDisplayType");
        if (savedType) setDisplayType(JSON.parse(savedType));
        else setDisplayType(1);
    }, [])
    useEffect(() => {
        if (displayType !== null) localStorage.setItem("buildDisplayType", JSON.stringify(displayType));
    }, [displayType]);

    useEffect(() => {
        if (loading)
            getBuild(id).then(x => {
                setBuild(x);
                setLoading(false);
                setLikeCount(x.like_count);
                setCommentCount(x.comment_count);
                document.title = `${x.title} | Limbus Company Team Building Hub`;
            });
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
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "end" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
                <h2 style={{ display: "flex", fontSize: "1.2rem", fontWeight: "bold", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "0.2rem" }}>
                        {build.keyword_ids.map(id => <KeywordIcon key={id} id={keywordIdMapping[id]} />)}
                    </div>
                    {build.title}
                </h2>
                <div style={{ fontSize: "0.9rem", marginBottom: "0.5rem", color: "#ddd" }}>
                    by <Username username={build.username} /> • {createdTimeAgo} {modifiedTimeAgo ? ` • Last edited ${modifiedTimeAgo}` : null}
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "10rem", gap: "0.2rem" }}>
                <div>Display Type</div>
                <button onClick={() => setDisplayType(p => (p + 1) % 3)}>{displayType === 0 ? "Icons Only" : (displayType === 1 ? "Icons with Names" : "Skill Types")}</button>
            </div>
        </div>

        {identitiesLoading || egosLoading ? null :
            <div className="sinner-grid">
                {Array.from({ length: 12 }, (_, index) =>
                    <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", width: "100%", border: "1px #444 solid" }}>
                        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
                            {build.identity_ids[index] ?
                                <IdentityProfile identity={identities[build.identity_ids[index]]} displayType={displayType} /> :
                                <div style={{ width: "100%", aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <SinnerIcon num={index + 1} style={{ width: "75%" }} />
                                </div>
                            }
                            <DeploymentComponent order={build.deployment_order} activeSinners={build.active_sinners} sinnerId={index + 1} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
                            {Array.from({ length: 5 }, (_, rank) => <EgoProfile key={rank} ego={egos[build.ego_ids[index][rank]] || null} displayType={displayType} />)}
                        </div>
                    </div>
                )}
            </div>
        }
        <div style={{ height: "0.5rem" }} />
        <div style={{ display: "flex", flexDirection: "row", width: "90%", alignSelf: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", paddingRight: "0.5rem", gap: "0.5rem", width: "70%" }}>
                <span style={{ fontSize: "1.2rem" }}>Description</span>
                <div className={{ maxWidth: "48rem", marginLeft: "auto", marginRight: "auto" }}>
                    <div>
                        <MarkdownRenderer content={build.body} />
                    </div>
                </div>
            </div>

            <div style={{ border: "1px #777 solid" }} />

            <div style={{ display: "flex", flexDirection: "column", paddingLeft: "0.5rem", width: "30%", gap: "0.25rem" }}>
                {build.team_code.trim().length > 0 ? <>
                    <div>
                        <span style={{ fontSize: "1.2rem", borderBottom: "1px #ddd dotted" }} data-tooltip-id="team-code-tooltip">Team Code</span>
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
                <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    Tags: {build.tags.map((t, i) => <Tag key={i} tag={t.name} />)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <LikeButton buildId={id} likeCount={likeCount} />
                    <SaveButton buildId={id} />
                    <button onClick={() => setShareOpen(true)}>
                        🔗 Share
                    </button>
                    {
                        user && user.id === build.user_id ?
                            <button onClick={editBuild}>
                                ✎ Edit
                            </button> : null
                    }
                    {
                        user && user.id === build.user_id ?
                            <button onClick={() => setDeleteOpen(true)}>
                                🗑️ Delete
                            </button> : null
                    }
                </div>
            </div>
        </div>

        <div style={{ border: "1px #777 solid" }} />
        {build.is_published ?
            <div style={{ width: "clamp(800px, 60%, 100%)", alignSelf: "center" }}>
                <CommentSection buildId={id} commentCount={commentCount} />
            </div> :
            <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>No comments while the build is not published.</p>
        }
        <Modal isOpen={shareOpen} onClose={() => setShareOpen(false)}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem", padding: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", alignSelf: "start" }}>
                    Address (click to copy):
                    <div style={{ position: "relative" }}>
                        <input value={window.location.href} onClick={handleLinkCopy} readOnly={true} style={{ width: "25rem" }} />
                        {linkCopySuccess !== '' ?
                            <div className="copy-popup">
                                <div className="copy-popup-box">
                                    {linkCopySuccess}
                                </div>
                            </div> :
                            null
                        }
                    </div>
                </div>
                <ImageStitcher identitiesList={build.identity_ids} outputFileName={`${build.id}.png`} />
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
