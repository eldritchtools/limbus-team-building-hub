import Link from "next/link";

export default function Username({username, flair, style={}}){
    if (flair) return <span><Link href={`/profiles/${username}`} style={style}>{username}</Link> <em style={{color: "#aaa"}}>({flair})</em></span>
    return <Link href={`/profiles/${username}`} style={style}>{username}</Link>
}