import { useAuth } from "../database/authProvider";
import NoPrefetchLink from "../NoPrefetchLink";
import { ReviewSolid } from "./Symbols";

export default function ReviewButton({ listId, iconSize }) {
    const { user } = useAuth();

    if (user) {
        return <NoPrefetchLink href={`/curated-lists/${listId}/review`} className="toggle-button" style={{ color: "#ddd", textDecoration: "none" }}>
            <ReviewSolid text={"Review Submissions"} size={iconSize} />
        </NoPrefetchLink>
    } else {
        return <div className="toggle-button-disabled">
            <ReviewSolid text={"Review Submissions"} size={iconSize} />
        </div>
    }
}
