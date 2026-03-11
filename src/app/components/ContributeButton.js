import { useAuth } from "../database/authProvider";
import NoPrefetchLink from "../NoPrefetchLink";
import { ContributeSolid } from "./Symbols";

export default function ContributeButton({ listId, iconSize }) {
    const { user } = useAuth();
    
    if (user) {
        return <NoPrefetchLink href={`/curated-lists/${listId}/contribute`} className="toggle-button" style={{ color: "#ddd", textDecoration: "none" }}>
            <ContributeSolid text={"Contribute"} size={iconSize} />
        </NoPrefetchLink>
    } else {
        return <div className="toggle-button-disabled">
            <ContributeSolid text={"Contribute"} size={iconSize} />
        </div>
    }
}
