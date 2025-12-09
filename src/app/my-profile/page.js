"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFilteredBuilds } from "../database/builds";
import { useAuth } from "../database/authProvider";
import { getSaves } from "../database/saves";
import { tabStyle } from "../styles";
import BuildsGrid from "../components/BuildsGrid";
import { useSearchParams } from "next/navigation";

export default function ProfilePage() {
    const { user, profile, loading, updateUsername, refreshProfile } = useAuth();
    const [username, setUsername] = useState("");
    const [error, setError] = useState(null);
    const [builds, setBuilds] = useState([]);
    const [buildsLoading, setBuildsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [updating, setUpdating] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        if (profile) setUsername(profile.username);
    }, [profile]);

    const [activeTab, setActiveTab] = useState("published");

    useEffect(() => {
        const tab = searchParams.get('tab');
        switch(tab) {
            case "builds": setActiveTab("published"); return;
            case "drafts": setActiveTab("drafts"); return;
            case "saved": setActiveTab("saved"); return;
            default: return;
        }
    }, [searchParams]);

    useEffect(() => {
        switch (activeTab) {
            case "published":
                if (user) {
                    setBuildsLoading(true);
                    getFilteredBuilds({ "user_id": user.id }, true, "recency", false, page, 24).then(b => { setBuilds(b); setBuildsLoading(false); })
                }
                break;
            case "drafts":
                if (user) {
                    setBuildsLoading(true);
                    getFilteredBuilds({ "user_id": user.id }, false, "recency", false, page, 24).then(b => { setBuilds(b); setBuildsLoading(false); })
                }
                break;
            case "saved":
                if (user) {
                    setBuildsLoading(true);
                    getSaves(user.id, page, 24).then(b => { setBuilds(b); setBuildsLoading(false); })
                }
                break;
            default:
                break;
        }

    }, [user, activeTab, page]);

    if (loading)
        return <div>
            <h2>Loading Profile...</h2>
        </div>;
    else if (!user)
        return <div>
            <h2>Login to see your profile.</h2>
        </div>

    const handleUpdate = async () => {
        setError('');

        if (!username.trim()) {
            setError('Username cannot be empty.');
            return;
        }

        setUpdating(true);
        const { error: insertError } = await updateUsername(user.id, username);

        if (insertError) {
            setUpdating(false);
            if (insertError.code === '23505') {
                // unique constraint violation
                setError('That username is already taken.');
            } else {
                setError(insertError.message);
            }
            return;
        }

        refreshProfile();
        window.location.reload();
    };

    return <div style={{ display: "flex", flexDirection: "column" }}>
        <h2>Details</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            Username: <input value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button onClick={handleUpdate} disabled={updating}>Update Profile</button>
            {error}
        </div>
        <h2>Builds</h2>
        <div style={{ display: "flex", marginBottom: "1rem", gap: "1rem" }}>
            <Link href="/builds/new" style={{ textDecoration: "none" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", cursor: "pointer", color: "#777" }}>+New Build</div>
            </Link>
            <div style={{ ...tabStyle, color: activeTab === "published" ? "#ddd" : "#777" }} onClick={() => setActiveTab("published")}>Published</div>
            <div style={{ ...tabStyle, color: activeTab === "drafts" ? "#ddd" : "#777" }} onClick={() => setActiveTab("drafts")}>Drafts</div>
            <div style={{ ...tabStyle, color: activeTab === "saved" ? "#ddd" : "#777" }} onClick={() => setActiveTab("saved")}>Saved</div>
        </div>

        {buildsLoading ?
            <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>Loading...</p> :
            builds.length === 0 ?
                <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>
                    {page === 1 ? `No ${activeTab === "published" ? "published builds" : activeTab === "drafts" ? "drafts" : "saved builds"} yet.` : "No more builds."}
                </p> :
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <BuildsGrid builds={builds} />

                    <div style={{ display: "flex", gap: "0.5rem", alignSelf: "end" }}>
                        <button className="page-button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                        <button className="page-button" disabled={builds.length < 24} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                </div>
        }

    </div>
}
