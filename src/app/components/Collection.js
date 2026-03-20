import BuildEntry from "../components/BuildEntry";
import Username from "./Username";
import ReactTimeAgo from "react-time-ago";
import Tag from "./Tag";
import "./Collection.css";
import NoPrefetchLink from "../NoPrefetchLink";
import LikeButton from "./LikeButton";
import CommentButton from "./CommentButton";
import SaveButton from "./SaveButton";
import ContributeButton from "./ContributeButton";
import { useAuth } from "../database/authProvider";
import ReviewButton from "./ReviewButton";
import MdPlan from "./MdPlan";

function isLocalId(id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return !uuidRegex.test(id);
}

export default function Collection({ collection, complete = true }) {
    const { user } = useAuth();

    return <div className="collection">
        <NoPrefetchLink href={`/collections/${collection.id}`} className="collection-link" />

        <div className="collection-contents">
            <h3 style={{ margin: 0 }}>{collection.title}</h3>
            <div style={{ fontSize: "0.9rem", marginBottom: "0.2rem", color: "#ddd", alignSelf: "start" }}>
                {!isLocalId(collection.id) ?
                    <span>by <Username username={collection.username} flair={collection.user_flair} /> • </span> :
                    null
                }<ReactTimeAgo date={collection.published_at ?? collection.created_at} locale="en-US" timeStyle="mini" />
            </div>
            <div style={{ color: "#aaa", fontSize: "0.9rem", alignSelf: "start", textAlign: "start" }}>
                {collection.short_desc}
            </div>
            {collection.items.length > 0 ?
                <div style={{ paddingLeft: "1rem", overflowX: "auto", scrollbarWidth: "thin", width: "100%" }}>
                    <div style={{ display: "flex", gap: "1rem" }}>
                        {collection.items.map(item =>
                            item.type === "build" ?
                                <BuildEntry key={item.data.id} build={item.data} size={"S"} complete={false} /> :
                                item.type === "md_plan" ?
                                    <MdPlan key={item.data.id} plan={item.data} complete={false} /> :
                                    null
                        )}
                    </div>
                </div> :
                <div style={{ textAlign: "center" }}>
                    No builds found...
                </div>
            }
            {collection.tags.length > 0 ?
                <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    Tags: {collection.tags.map((t, i) => t ? <Tag key={i} tag={t} type={"collections"} /> : null)}
                </div> :
                null
            }
            {complete ?
                <div style={{ display: "flex", gap: "0.5rem", pointerEvents: "all" }}>
                    <LikeButton targetType={"collection"} targetId={collection.id} likeCount={collection.like_count} iconSize={20} />
                    <CommentButton targetPath={"collections"} targetId={collection.id} count={collection.comment_count} iconSize={20} />
                    <SaveButton targetType={"collection"} targetId={collection.id} iconSize={20} />
                    {collection.submission_mode === "open" ? <ContributeButton collectionId={collection.id} iconSize={20} /> : null}
                    {user?.id === collection.user_id ? <ReviewButton collectionId={collection.id} iconSize={20} /> : null}
                </div> :
                null
            }
        </div>
    </div>
}