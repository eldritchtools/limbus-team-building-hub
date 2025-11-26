"use client";

import { KeywordIcon } from "@eldritchtools/limbus-shared-library";
import { keywordIdMapping } from "../keywordIds";
import Tag from "./Tag";
import { useTimeAgo } from "../utils";
import Link from "next/link";
import Username from "./Username";
import IdentityImgSpread from "./IdentityImgSpread";

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
        <div style={{ width: "720px", display: "flex", flexDirection: "column", border: "1px #777 solid", borderRadius: "1rem", padding: "1rem", boxSizing: "border-box", textAlign: "left" }}>
            <Link href={`/builds/${build.id}`}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginTop: "0.2rem", marginBottom: "0.5rem" }}>{build.title}</h2>
            </Link>
            <div style={{ fontSize: "0.8rem", marginBottom: "0.5rem", color: "#ddd" }}>
                by <Username username={build.username} /> •{" "}{timeAgo}
            </div>
            <div style={{ display: "flex", flexDirection: "row", marginBottom: "0.5rem" }}>
                <IdentityImgSpread identityIds={build.identity_ids} scale={.375} />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                    <div style={{ marginBottom: "0.5rem" }}>
                        Keywords
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 32px)" }}>
                        {build.keyword_ids.map((id, i) => <KeywordIcon key={i} id={keywordIdMapping[id]} />)}
                    </div>
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center" }}>
                Tags: {build.tags.map((t, i) => t ? <Tag key={i} tag={t} /> : null)}
            </div>
            <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center" }}>
                👍 {build.like_count} 💬 {build.comment_count}
            </div>
        </div>
    );
}
