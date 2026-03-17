"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import CollectionsSearchComponent from "../CollectionsSearchComponent";
import { searchCollections } from "@/app/database/collections";
import Collection from "@/app/components/Collection";

export default function SearchCollectionsContent() {
    const searchParams = useSearchParams();

    const filters = useMemo(() => searchParams.entries().reduce((acc, [f, v]) => {
        if (f === "search") acc[f] = v;
        else if (f === "tags") acc[f] = v.split(",");
        return acc;
    }, {}), [searchParams]);

    const options = useMemo(() => { return { ...filters } }, [filters]);

    const [collections, setCollections] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLists = async () => {
            try {
                setLoading(true);

                const newFilters = Object.entries(filters).reduce((acc, [f, v]) => {
                    if (f === "search") acc["query"] = v;
                    else if (f === "tags") acc[f] = v;
                    return acc;
                }, {});
                const data = await searchCollections({ ...newFilters, "ignore_block_discovery": true }, true, null, page, 10);

                setCollections(data || []);
                setLoading(false);
            } catch (err) {
                console.error("Error loading collections:", err);
            }
        };

        fetchLists();
    }, [searchParams, filters, page]);

    return <div style={{ display: "flex", flexDirection: "column", textAlign: "center", gap: "1rem" }}>
        <CollectionsSearchComponent options={options} />
        <div style={{ border: "1px #777 solid" }} />

        {loading ?
            <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>Loading collections...</p> :
            collections.length === 0 ?
                <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>
                    {page === 1 ? "No published collections." : "No more collections."}
                </p> :
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {collections.map(collection => <Collection key={collection.id} collection={collection} />)}

                    <div style={{ display: "flex", gap: "0.5rem", alignSelf: "end" }}>
                        <button className="page-button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                        <button className="page-button" disabled={collections.length < 10} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                </div>
        }
    </div>;
}
