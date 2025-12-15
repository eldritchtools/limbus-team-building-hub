"use client";
import { useEffect, useState } from "react";
import { getFilteredBuilds, getPopularBuilds } from "../database/builds";
import SearchComponent from "./SearchComponent";
import { tabStyle } from "../styles";
import BuildsGrid from "../components/BuildsGrid";

export default function BuildsPage() {
    const [builds, setBuilds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(null);
    const [refreshCounter, setRefreshCounter] = useState(0);

    useEffect(() => {
        const saved = localStorage.getItem("buildsActiveTab");
        setActiveTab(saved ?? "popular");
    }, []);

    useEffect(() => {
        if (!activeTab) return;

        let canceled = false;

        const fetchBuilds = async () => {
            try {
                setLoading(true);
                const data = activeTab === "popular" ?
                    await getPopularBuilds() :
                    activeTab === "recent" ?
                        await getFilteredBuilds({}, true, "recency", false, 1, 24) :
                        await getFilteredBuilds({}, true, "random", false, 1, 24);
                if (!canceled) {
                    setBuilds(data || []);
                }
            } catch (err) {
                if (!canceled) console.error(err);
            } finally {
                if (!canceled) setLoading(false);
            }
        };

        fetchBuilds();
        localStorage.setItem("buildsActiveTab", activeTab);
        return () => {
            canceled = true;
        };
    }, [activeTab, refreshCounter]);

    const handleTabClick = (tab) => {
        if (activeTab === tab) setRefreshCounter(p => p+1);
        else setActiveTab(tab);
    }

    return <div style={{ display: "flex", flexDirection: "column", textAlign: "center", gap: "0.5rem" }}>
        <SearchComponent />
        <div style={{ border: "1px #777 solid" }} />
        <div style={{ display: "flex", flexDirection: "row", gap: "1rem", alignSelf: "center", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{ ...tabStyle, color: activeTab === "popular" ? "#ddd" : "#777" }} onClick={() => handleTabClick("popular")}>Popular</div>
            <div style={{ ...tabStyle, color: activeTab === "recent" ? "#ddd" : "#777" }} onClick={() => handleTabClick("recent")}>New</div>
            <div style={{ ...tabStyle, color: activeTab === "random" ? "#ddd" : "#777" }} onClick={() => handleTabClick("random")}>Random</div>
        </div>
        {loading ?
            <div style={{ color: "#9ca3af" }}>
                {"Loading builds..."}
            </div> :
            <div style={{ display: "flex", flexDirection: "column" }}>
                {activeTab === "popular" ?
                    <p style={{ color: "#aaa", fontSize: "1rem", textAlign: "center", alignSelf: "center", marginBottom: "0.5rem" }}>Most popular builds are recomputed every few hours.</p> :
                    null}
                <BuildsGrid builds={builds} />
            </div>}
    </div>;
}
