"use client";

import { KeywordIcon } from "@eldritchtools/limbus-shared-library";
import { keywordIdMapping } from "../keywordIds";
import Tag from "./Tag";
import Link from "next/link";
import Username from "./Username";
import IdentityImgSpread from "./IdentityImgSpread";
import LikeButton from "./LikeButton";
import SaveButton from "./SaveButton";
import ReactTimeAgo from "react-time-ago";
import { decodeBuildExtraOpts } from "./BuildExtraOpts";
import { useBreakpoint } from "@eldritchtools/shared-components";

function getSizes(size, isMobile) {
    if(isMobile || size === "S") return { width: "300px", margins: "0.2rem", iconSize: 24, scale: 0.175 };
    if(size === "M") return { width: "450px", margins: "0.2rem", iconSize: 32, scale: 0.275 };
    if(size === "L") return { width: "640px", margins: "0.5rem", iconSize: 32, scale: 0.375 }
    return null;
}

export default function BuildEntry({ build, size, complete = true }) {
    const extraProps = {};
    if (build.extra_opts) {
        const extraOpts = decodeBuildExtraOpts(build.extra_opts, ["iu"])
        if (extraOpts.identityUpties) extraProps.identityUpties = extraOpts.identityUpties;
    }

    const { isMobile } = useBreakpoint();
    const sizes = getSizes(size, isMobile);

    if (!sizes) return null;

    return <div style={{ width: sizes.width, display: "flex", flexDirection: "column", border: "1px #777 solid", borderRadius: "1rem", padding: "1rem", boxSizing: "border-box", textAlign: "left" }}>
        <Link href={`/builds/${build.id}`}>
            <h2 style={{ display: "flex", fontSize: "1.2rem", fontWeight: "bold", alignItems: "center", gap: "0.2rem", marginTop: "0rem", marginBottom: sizes.margins }}>
                {complete ?
                    <div style={{ display: "flex", gap: "0" }}>
                        {build.keyword_ids.map(id => <KeywordIcon key={id} id={keywordIdMapping[id]} size={sizes.iconSize} />)}
                    </div> : null}
                {build.title}
            </h2>
        </Link>
        <div style={{ fontSize: "0.8rem", marginBottom: sizes.margins, color: "#ddd" }}>
            by <Username username={build.username} flair={build.user_flair} /> •{" "}<ReactTimeAgo date={build.published_at ?? build.created_at} locale="en-US" timeStyle="mini" />
        </div>
        <div style={{ display: "flex", flexDirection: "row", marginBottom: sizes.margins, alignSelf: "center" }}>
            <IdentityImgSpread identityIds={build.identity_ids} scale={sizes.scale} deploymentOrder={build.deployment_order} activeSinners={build.active_sinners} {...extraProps} />
        </div>
        {complete ? <>
            <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                {size === "L" ? "Tags: " : null}{build.tags.map((t, i) => t ? <Tag key={i} tag={t} /> : null)}
            </div>
            <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center", marginTop: "0.25rem" }}>
                <LikeButton buildId={build.id} likeCount={build.like_count} />
                <SaveButton buildId={build.id} />
                💬 {build.comment_count}
            </div>
        </> : null}
    </div>
}
