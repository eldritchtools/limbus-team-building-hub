"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getFilteredBuilds } from "../../database/builds";
import SearchComponent from "../SearchComponent";
import { keywordToIdMapping } from "../../keywordIds";
import BuildsGrid from "../../components/BuildsGrid";

export default function SearchBuildsContent() {
    const searchParams = useSearchParams();

    const filters = useMemo(() => searchParams.entries().reduce((acc, [f, v]) => {
        if (f === "title") acc[f] = v;
        else if (f === "username") acc[f] = v;
        else if (f === "tags") acc[f] = v.split(",");
        else if (f === "identities" || f === "egos") acc[f] = v.split(",").map(x => parseInt(x));
        else if (f === "keywords") acc[f] = v.split(",").map(x => keywordToIdMapping[x]);
        return acc;
    }, {}), [searchParams]);

    const sortBy = useMemo(() => searchParams.get("sortBy") || "score", [searchParams]);
    const strictFiltering = useMemo(() => searchParams.get("strictFiltering") === "true" || false, [searchParams])
    const options = useMemo(() => { return { ...filters, sortBy: sortBy, strictFiltering: strictFiltering } }, [filters, sortBy, strictFiltering]);

    const [builds, setBuilds] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBuilds = async () => {
            try {
                setLoading(true);
                const data = await getFilteredBuilds(filters, true, sortBy, strictFiltering, page, 24);

                setBuilds(data || []);
                setLoading(false);
            } catch (err) {
                console.error("Error loading builds:", err);
            }
        };

        fetchBuilds();
    }, [searchParams, filters, page, sortBy, strictFiltering]);

    return <div style={{ display: "flex", flexDirection: "column", textAlign: "center", gap: "1rem" }}>
        <SearchComponent options={options} />
        <div style={{ border: "1px #777 solid" }} />

        {loading ?
            <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>Loading builds...</p> :
            builds.length === 0 ?
                <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>
                    {page === 1 ? "No published builds yet." : "No more builds."}
                </p> :
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <BuildsGrid builds={builds} />

                    <div style={{ display: "flex", gap: "0.5rem", alignSelf: "end" }}>
                        <button className="page-button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                        <button className="page-button" disabled={builds.length < 24} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                </div>}
    </div>;
}
