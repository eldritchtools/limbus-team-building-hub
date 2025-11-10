"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import BuildEntry from "../../components/BuildEntry";
import { getFilteredBuilds } from "../../database/builds";
import SearchComponent from "../SearchComponent";
import { keywordToIdMapping } from "../../keywordIds";

export default function SearchBuildsPage() {
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
    const options = useMemo(() => { return { ...filters, sortBy: sortBy } }, [filters, sortBy]);

    const [builds, setBuilds] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBuilds = async () => {
            try {
                setLoading(true);
                const data = await getFilteredBuilds(filters, true, sortBy, page, 24);

                setBuilds(data || []);
                setLoading(false);
            } catch (err) {
                console.error("Error loading builds:", err);
            }
        };

        fetchBuilds();
    }, [searchParams, filters, page, sortBy]);

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
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 720px)", gap: "0.5rem", justifyContent: "center" }}>
                        {builds.map(build => <BuildEntry key={build.id} build={build} />)}
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", alignSelf: "end" }}>
                        <button className="page-button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                        <button className="page-button" disabled={builds.length < 24} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                </div>}
    </div>;
}
