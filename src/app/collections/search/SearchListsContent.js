"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ListsSearchComponent from "../CollectionsSearchComponent";
import { searchCuratedLists } from "@/app/database/collections";
import CuratedList from "@/app/components/CuratedList";

export default function SearchListsContent() {
    const searchParams = useSearchParams();

    const filters = useMemo(() => searchParams.entries().reduce((acc, [f, v]) => {
        if (f === "search") acc[f] = v;
        else if (f === "tags") acc[f] = v.split(",");
        return acc;
    }, {}), [searchParams]);

    const options = useMemo(() => { return { ...filters } }, [filters]);

    const [lists, setLists] = useState([]);
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
                const data = await searchCuratedLists({ ...newFilters, "ignore_block_discovery": true }, true, null, page, 10);

                setLists(data || []);
                setLoading(false);
            } catch (err) {
                console.error("Error loading lists:", err);
            }
        };

        fetchLists();
    }, [searchParams, filters, page]);

    return <div style={{ display: "flex", flexDirection: "column", textAlign: "center", gap: "1rem" }}>
        <ListsSearchComponent options={options} />
        <div style={{ border: "1px #777 solid" }} />

        {loading ?
            <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>Loading curated lists...</p> :
            lists.length === 0 ?
                <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>
                    {page === 1 ? "No published curated lists." : "No more curated lists."}
                </p> :
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {lists.map(list => <CuratedList key={list.id} list={list} />)}

                    <div style={{ display: "flex", gap: "0.5rem", alignSelf: "end" }}>
                        <button className="page-button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                        <button className="page-button" disabled={lists.length < 10} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                </div>
        }
    </div>;
}
