"use client";

import { KeywordIcon } from "@eldritchtools/limbus-shared-library";
import { keywordIdMapping } from "../keywordIds";
import Tag from "./Tag";
import { useTimeAgo } from "../utils";
import Link from "next/link";
import Username from "./Username";
import IdentityImgSpread from "./IdentityImgSpread";
import LikeButton from "./LikeButton";
import SaveButton from "./SaveButton";

export default function BuildEntry({ build, minified }) {
    const timeAgo = useTimeAgo(build.created_at);

    if (minified)
        return <div style={{ width: "450px", display: "flex", flexDirection: "column", border: "1px #777 solid", borderRadius: "1rem", padding: "0.5rem", boxSizing: "border-box", textAlign: "left" }}>
            <Link href={`/builds/${build.id}`}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginTop: "0rem", marginBottom: "0.2rem" }}>{build.title}</h2>
            </Link>
            <div style={{ fontSize: "0.8rem", marginBottom: "0.5rem", color: "#ddd" }}>
                by <Username username={build.username} /> •{" "}{timeAgo}
            </div>
            <div style={{ display: "flex", flexDirection: "row", alignSelf: "center" }}>
                <IdentityImgSpread identityIds={build.identity_ids} scale={.275} />
            </div>
        </div>

    return (
        <div style={{ width: "640px", display: "flex", flexDirection: "column", border: "1px #777 solid", borderRadius: "1rem", padding: "1rem", boxSizing: "border-box", textAlign: "left" }}>
            <Link href={`/builds/${build.id}`}>
                <h2 style={{ display: "flex", fontSize: "1.2rem", fontWeight: "bold", alignItems: "center", gap: "0.2rem", marginTop: "0", marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", gap: "0" }}>
                        {build.keyword_ids.map(id => <KeywordIcon key={id} id={keywordIdMapping[id]} />)}
                    </div>
                    {build.title}
                </h2>
            </Link>
            <div style={{ fontSize: "0.8rem", marginBottom: "0.5rem", color: "#ddd" }}>
                by <Username username={build.username} /> •{" "}{timeAgo}
            </div>
            <div style={{ display: "flex", flexDirection: "row", marginBottom: "0.5rem", alignSelf: "center" }}>
                <IdentityImgSpread identityIds={build.identity_ids} scale={.375} deploymentOrder={build.deployment_order} activeSinners={build.active_sinners} />
            </div>
            <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center" }}>
                Tags: {build.tags.map((t, i) => t ? <Tag key={i} tag={t} /> : null)}
            </div>
            <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center", marginTop: "0.25rem" }}>
                <LikeButton buildId={build.id} likeCount={build.like_count} /> 
                <SaveButton buildId={build.id} />
                💬 {build.comment_count}
            </div>
        </div>
    );
}
