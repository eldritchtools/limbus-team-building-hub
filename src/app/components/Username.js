import Link from "next/link";

export default function Username({username, style={}}){
    return <Link href={`/profiles/${username}`} style={style}>{username}</Link>
}