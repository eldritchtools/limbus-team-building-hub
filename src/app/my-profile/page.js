"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFilteredBuilds } from "../database/builds";
import { useAuth } from "../database/authProvider";
import { getSaves } from "../database/saves";
import { tabStyle } from "../styles";
import BuildsGrid from "../components/BuildsGrid";
import { useSearchParams } from "next/navigation";
import { updateUser } from "../database/users";
import MarkdownEditorWrapper from "../components/Markdown/MarkdownEditorWrapper";

export default function ProfilePage() {
    const { user, profile, loading, updateUsername, refreshProfile } = useAuth();
    const [username, setUsername] = useState("");
    const [usernameError, setUsernameError] = useState(null);
    const [builds, setBuilds] = useState([]);
    const [buildsLoading, setBuildsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [flair, setFlair] = useState("");
    const [description, setDescription] = useState("");
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState(null);
    const [updating, setUpdating] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        if (profile) {
            setUsername(profile.username);
            setFlair(profile.flair ?? "");
            setDescription(profile.description ?? "");
            setProfileLoading(false);
        }
    }, [profile]);

    const [activeTab, setActiveTab] = useState("published");

    useEffect(() => {
        const tab = searchParams.get('tab');
        switch (tab) {
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
                    getFilteredBuilds({ "user_id": user.id }, false, "recency", false, page, 24).then(b => { console.log(b); setBuilds(b); setBuildsLoading(false); })
                }
                break;
            case "saved":
                if (user) {
                    setBuildsLoading(true);
                    getSaves(user.id, page, 24).then(b => { console.log(b); setBuilds(b); setBuildsLoading(false); })
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

    const handleUpdateUsername = async () => {
        setUsernameError('');

        if (!username.trim()) {
            setUsernameError('Username cannot be empty.');
            return;
        }

        setUpdating(true);
        const { error: insertError } = await updateUsername(user.id, username);

        if (insertError) {
            setUpdating(false);
            if (insertError.code === '23505') {
                // unique constraint violation
                setUsernameError('That username is already taken.');
            } else {
                setUsernameError(insertError.message);
            }
            return;
        }

        refreshProfile();
        window.location.reload();
    };

    const handleUpdateProfile = async () => {
        setProfileError('');

        if (flair.trim().length > 32) {
            setProfileError('Flair is too long');
            return;
        }

        setUpdating(true);
        await updateUser(user.id, flair.trim(), description);
        setUpdating(false);

        refreshProfile();
        window.location.reload();
    };

    return <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {!profileLoading ?
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "1600px" }}>
                <h2>Details</h2>
                <div>
                    View your profile <Link href={`profiles/${profile.username}`}>here</Link>.
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    Username: <input value={username} onChange={e => setUsername(e.target.value)} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button onClick={handleUpdateUsername} disabled={updating}>Update Username</button>
                    {usernameError}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    Flair: <input value={flair} onChange={e => setFlair(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    Profile Description:
                    <MarkdownEditorWrapper value={description} onChange={setDescription} placeholder="Write your profile description..." short={true} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button onClick={handleUpdateProfile} disabled={updating}>Update Profile</button>
                    {profileError}
                </div>
            </div> :
            <h2>Login to edit profile</h2>
        }

        <div style={{ border: "1px #777 solid" }} />

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
