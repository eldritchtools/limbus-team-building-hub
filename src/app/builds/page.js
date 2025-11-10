"use client";
import { useEffect, useState } from "react";
import BuildEntry from "../components/BuildEntry";
import { getFilteredBuilds, getPopularBuilds } from "../database/builds";
import SearchComponent from "./SearchComponent";

export const metadata = {
    title: "Team Builds",
    description: "Browse team builds"
};

export default function BuildsPage() {
    const [builds, setBuilds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("popular");

    useEffect(() => {
        const fetchBuilds = async () => {
            try {
                setLoading(true);
                const data = activeTab === "popular" ?
                    await getPopularBuilds() :
                    activeTab === "recent" ?
                        await getFilteredBuilds({}, true, "recency", 1, 24) :
                        await getFilteredBuilds({}, true, "random", 1, 24);

                setBuilds(data || []);
                setLoading(false);
            } catch (err) {
                console.error("Error loading builds:", err);
            }
        };

        fetchBuilds();
    }, [activeTab]);

    return <div style={{ display: "flex", flexDirection: "column", textAlign: "center", gap: "0.5rem" }}>
        <SearchComponent />
        <div style={{ border: "1px #777 solid" }} />
        <div style={{ display: "flex", flexDirection: "row", gap: "1rem", alignSelf: "center", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", cursor: "pointer", color: activeTab === "popular" ? "#ddd" : "#777", transition: "all 0.2s" }} onClick={() => setActiveTab("popular")}>Popular</div>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", cursor: "pointer", color: activeTab === "recent" ? "#ddd" : "#777", transition: "all 0.2s" }} onClick={() => setActiveTab("recent")}>New</div>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", cursor: "pointer", color: activeTab === "random" ? "#ddd" : "#777", transition: "all 0.2s" }} onClick={() => setActiveTab("random")}>Random</div>
        </div>
        {loading ?
            <div style={{ color: "#9ca3af" }}>
                {"Loading builds..."}
            </div> :
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 720px)", gap: "0.5rem", justifyContent: "center" }}>
                {builds.map(build => <BuildEntry key={build.id} build={build} />)}
            </div>}
    </div>;
}
