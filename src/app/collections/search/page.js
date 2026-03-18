import { Suspense } from "react";
import SearchCollectionsContent from "./SearchCollectionsContent";

export default function SearchCollectionsPage() {
    return <div style={{ display: "flex", flexDirection: "column", textAlign: "center", gap: "1rem" }}>
        <Suspense fallback={<div>Loading...</div>}>
            <SearchCollectionsContent />
        </Suspense>
    </div>
}
