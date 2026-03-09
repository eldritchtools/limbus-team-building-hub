"use client";
import { useEffect, useState } from "react";
import ListsSearchComponent from "./ListsSearchComponent";
import { tabStyle } from "../styles";
import { useSearchParams } from "next/navigation";
import CuratedList from "../components/CuratedList";
import { searchCuratedLists } from "../database/curatedLists";

export default function CuratedListsPage() {
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(null);
    const [refreshCounter, setRefreshCounter] = useState(0);
    const searchParams = useSearchParams();

    useEffect(() => {
        const mode = searchParams.get('mode');
        if (["popular", "recent", "random"].includes(mode)) {
            setActiveTab(mode);
        } else {
            const saved = localStorage.getItem("listsActiveTab");
            setActiveTab(saved ?? "popular");
        }
    }, [searchParams]);

    useEffect(() => {
        if (!activeTab) return;

        let canceled = false;

        const fetchLists = async () => {
            try {
                setLoading(true);
                const data = activeTab === "popular" ?
                    await searchCuratedLists({}, true, "popular", 1, 10) :
                    activeTab === "recent" ?
                        await searchCuratedLists({}, true, "new", 1, 10) :
                        await searchCuratedLists({}, true, "random", 1, 10)
                if (!canceled) {
                    setLists(data || []);
                }
            } catch (err) {
                if (!canceled) console.error(err);
            } finally {
                if (!canceled) setLoading(false);
            }
        };

        fetchLists();
        localStorage.setItem("listsActiveTab", activeTab);
        return () => {
            canceled = true;
        };
    }, [activeTab, refreshCounter]);

    const handleTabClick = (tab) => {
        if (activeTab === tab) setRefreshCounter(p => p + 1);
        else setActiveTab(tab);
    }

    return <div style={{ display: "flex", flexDirection: "column", textAlign: "center", gap: "0.5rem" }}>
        <ListsSearchComponent />
        <div style={{ border: "1px #777 solid" }} />
        <div style={{ display: "flex", flexDirection: "row", gap: "1rem", alignSelf: "center", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{ ...tabStyle, color: activeTab === "popular" ? "#ddd" : "#777" }} onClick={() => handleTabClick("popular")}>Popular</div>
            <div style={{ ...tabStyle, color: activeTab === "recent" ? "#ddd" : "#777" }} onClick={() => handleTabClick("recent")}>New</div>
            <div style={{ ...tabStyle, color: activeTab === "random" ? "#ddd" : "#777" }} onClick={() => handleTabClick("random")}>Random</div>
        </div>
        {loading ?
            <div style={{ color: "#9ca3af" }}>
                {"Loading curated lists..."}
            </div> :
            (lists.length === 0 ?
                <div>
                    No published curated lists.
                </div> :
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {lists.map(list => <CuratedList key={list.id} list={list} />)}
                </div>
            )}
    </div>;
}
