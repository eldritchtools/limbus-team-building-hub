import { Suspense } from "react";
import SearchBuildsContent from "./SearchBuildsContent";

export default function SearchBuildsPage() {
    return <div style={{ display: "flex", flexDirection: "column", textAlign: "center", gap: "1rem" }}>
        <Suspense fallback={<div>Loading...</div>}>
            <SearchBuildsContent />
        </Suspense>
    </div>
}
