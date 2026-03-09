import BuildEntry from "../components/BuildEntry";
import Username from "./Username";
import ReactTimeAgo from "react-time-ago";
import Tag from "./Tag";
import "./CuratedList.css";
import NoPrefetchLink from "../NoPrefetchLink";
import LikeButton from "./LikeButton";
import CommentButton from "./CommentButton";
import SaveButton from "./SaveButton";
import ContributeButton from "./ContributeButton";

function isLocalId(id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return !uuidRegex.test(id);
}

export default function CuratedList({ list }) {
    return <div className="curated-list">
        <NoPrefetchLink href={`/curated-lists/${list.id}`} className="curated-list-link" />

        <div className="curated-list-contents">
            <h3 style={{ margin: 0 }}>{list.title}</h3>
            <div style={{ fontSize: "0.9rem", marginBottom: "0.2rem", color: "#ddd", alignSelf: "start" }}>
                {!isLocalId(list.id) ?
                    <span>by <Username username={list.username} flair={list.user_flair} /> • </span> :
                    null
                }<ReactTimeAgo date={list.published_at ?? list.created_at} locale="en-US" timeStyle="mini" />
            </div>
            <div style={{ color: "#aaa", fontSize: "0.9rem", alignSelf: "start", textAlign: "start" }}>
                {list.short_desc}
            </div>
            {list.items.length > 0 ?
                <div style={{ paddingLeft: "1rem", overflowX: "auto", scrollbarWidth: "thin", width: "100%" }}>
                    <div style={{ display: "flex", gap: "1rem" }}>
                        {list.items.map(build => <BuildEntry key={build.id} build={build} size={"S"} complete={false} />)}
                    </div>
                </div> :
                <div style={{ textAlign: "center" }}>
                    No builds found...
                </div>
            }
            {list.tags.length > 0 ?
                <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    Tags: {list.tags.map((t, i) => t ? <Tag key={i} tag={t} type={"curated-lists"} /> : null)}
                </div> :
                null
            }
            <div style={{ display: "flex", gap: "0.5rem", pointerEvents: "all" }}>
                <LikeButton targetType={"build_list"} targetId={list.id} likeCount={list.like_count} iconSize={20} />
                <CommentButton targetPath={"curated-lists"} targetId={list.id} count={list.comment_count} iconSize={20} />
                <SaveButton targetType={"build_list"} targetId={list.id} iconSize={20} />
                {list.submission_mode === "open" ? <ContributeButton listId={list.id} iconSize={20} /> : null}
            </div>
        </div>
    </div>
}