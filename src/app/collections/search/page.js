import { Suspense } from "react";
import SearchListsContent from "./SearchListsContent";

export default function SearchListsPage() {
    return <div style={{ display: "flex", flexDirection: "column", textAlign: "center", gap: "1rem" }}>
        <Suspense fallback={<div>Loading...</div>}>
            <SearchListsContent />
        </Suspense>
    </div>
}
