import "./Username.css";
import NoPrefetchLink from "../NoPrefetchLink";

export default function Username({username, flair, style={}}){
    if (flair) 
        return <span style={{whiteSpace: "wrap"}}>
            <NoPrefetchLink href={`/profiles/${username}`} className="username" style={style}>{username}</NoPrefetchLink> <em style={{color: "#aaa"}}>({flair})</em>
        </span>
    return <NoPrefetchLink href={`/profiles/${username}`} className="username" style={style}>{username}</NoPrefetchLink>
}