"use client";

import { KeywordIcon } from "@eldritchtools/limbus-shared-library";
import { keywordIdMapping } from "../keywordIds";
import Tag from "./Tag";
import Username from "./Username";
import IdentityImgSpread from "./IdentityImgSpread";
import LikeButton from "./LikeButton";
import SaveButton from "./SaveButton";
import ReactTimeAgo from "react-time-ago";
import { decodeBuildExtraOpts } from "./BuildExtraOpts";
import { useBreakpoint } from "@eldritchtools/shared-components";
import "./BuildEntry.css";
import CommentButton from "./CommentButton";
import NoPrefetchLink from "../NoPrefetchLink";

function getSizes(size, isMobile) {
    if (isMobile || size === "S") return { width: "300px", iconSize: 24, buttonIconSize: 16, scale: 0.175, maxRailIcons: 5 };
    if (size === "M") return { width: "460px", iconSize: 28, buttonIconSize: 20, scale: 0.275, maxRailIcons: 7 };
    if (size === "L") return { width: "640px", iconSize: 28, buttonIconSize: 20, scale: 0.375, maxRailIcons: 10 }
    return null;
}

function isLocalId(id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return !uuidRegex.test(id);
}

export default function BuildEntry({ build, size, complete = true, clickable = true }) {
    const extraProps = {};
    if (build.extra_opts) {
        const extraOpts = decodeBuildExtraOpts(build.extra_opts, ["iu"]);
        if (extraOpts.identityUpties) extraProps.identityUpties = extraOpts.identityUpties;
    }

    const { isMobile } = useBreakpoint();
    const sizes = getSizes(size, isMobile);

    if (!sizes) return null;

    const hiddenIcons = build.keyword_ids.length - sizes.maxRailIcons;

    return <div className="build-entry" style={{ width: sizes.width }}>
        {clickable ? <NoPrefetchLink href={`/builds/${build.id}`} className="build-entry-link" /> : null}

        {build.keyword_ids.length > 0 ?
            <div className="build-icon-rails">
                {build.keyword_ids.slice(0, sizes.maxRailIcons).map(id => <KeywordIcon key={id} id={keywordIdMapping[id]} size={sizes.iconSize} />)}
                {hiddenIcons > 0 ? <span style={{
                    width: sizes.iconSize, height: sizes.iconSize, display: "flex",
                    alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#7c6a55"
                }}>+{hiddenIcons}</span> : null}
            </div> :
            null
        }

        <div className="build-contents" style={{ marginTop: build.keyword_ids.length === 0 ? 0 : "0px" }}>
            <div style={{ display: "flex", height: "2.4rem", alignItems: "center", marginBottom: "0.2rem" }}>
                <h2 className="build-title" style={{ fontSize: "1.2rem", fontWeight: "bold", marginTop: "0", marginBottom: "0" }}>
                    {build.title}
                </h2>
            </div>
            <div style={{ fontSize: "0.8rem", marginBottom: "0.2rem", color: "#ddd" }}>
                {!isLocalId(build.id) ?
                    <span>by <Username username={build.username} flair={build.user_flair} clickable={clickable} /> • </span> :
                    null
                }<ReactTimeAgo date={build.published_at ?? build.created_at} locale="en-US" timeStyle="mini" />
            </div>
            <div style={{ marginBottom: "0.2rem", alignSelf: "center" }}>
                <IdentityImgSpread identityIds={build.identity_ids} scale={sizes.scale} deploymentOrder={build.deployment_order} activeSinners={build.active_sinners} {...extraProps} />
            </div>
            {complete ? <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                {build.tags.map((t, i) => t ? <Tag key={i} tag={t} type={"builds"} /> : null)}
            </div> : null}
        </div>
        {complete ?
            <div className="build-buttons-container">
                <LikeButton targetType={"build"} targetId={build.id} likeCount={build.like_count} buildEntryVersion={true} iconSize={sizes.buttonIconSize} />
                <CommentButton targetPath={"builds"} targetId={build.id} count={build.comment_count} buildEntryVersion={true} iconSize={sizes.buttonIconSize} />
                <SaveButton targetType={"build"} targetId={build.id} buildEntryVersion={true} iconSize={sizes.buttonIconSize} />
            </div>
            : null}
    </div>
}
