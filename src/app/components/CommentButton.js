import Link from "next/link";
import { CommentSolid } from "./Symbols";

const style = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderLeft: "2px #7c6a55 dashed",
    borderRight: "2px #7c6a55 dashed",
    color: "#ddd",
    textDecoration: "none"
};

export default function CommentButton({ buildId, count, iconSize }) {
    const text = count === 1 ? "1 Comment" : `${count} Comments`;
    
    return <Link href={`/builds/${buildId}#comments`} style={style}>
        <CommentSolid text={text} size={iconSize} />
    </Link>
}
