"use client";

import { useEffect, useMemo, useState } from "react";
import { getFilteredBuilds } from "../database/builds";
import { useAuth } from "../database/authProvider";
import { getSavedBuilds, getSavedCuratedLists } from "../database/saves";
import { tabStyle } from "../styles";
import BuildsGrid from "../components/BuildsGrid";
import { useSearchParams } from "next/navigation";
import { updateUser } from "../database/users";
import MarkdownEditorWrapper from "../components/Markdown/MarkdownEditorWrapper";
import { buildsStore, listsStore, savedListsStore, savesStore } from "../database/localDB";
import DropdownButton from "../components/DropdownButton";
import { SocialIcon, socialsData } from "../lib/userSocials";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { searchCuratedLists } from "../database/curatedLists";
import CuratedList from "../components/CuratedList";
import NoPrefetchLink from "../NoPrefetchLink";

function SocialsComponent({ socials, setSocials }) {
    const swapOrder = (i1, i2) => {
        const arr = [...socials];
        [arr[i1], arr[i2]] = [arr[i2], arr[i1]];
        setSocials(arr)
    }

    const handleChange = (index, value) => {
        setSocials(socials.map((social, i) => index === i ? { ...social, value: value } : social));
    }

    const handleRemove = (index) => {
        setSocials(socials.filter((s, i) => index !== i));
    }

    return <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {socials.map((social, i) =>
            <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <button onClick={() => swapOrder(i, i - 1)} style={{ fontSize: "0.5rem", padding: "1px 3px" }} disabled={i === 0}><FaChevronUp /></button>
                    <button onClick={() => swapOrder(i, i + 1)} style={{ fontSize: "0.5rem", padding: "1px 3px" }} disabled={i === socials.length - 1}><FaChevronDown /></button>
                </div>
                <SocialIcon type={social.type} iconSize={1.5} link={false} />
                <input
                    type="text"
                    value={social.value}
                    onChange={e => handleChange(i, e.target.value)}
                    style={{ borderColor: social.invalid ? "#fe0000" : "#555" }}
                    placeholder={socialsData[social.type].placeholder}
                />
                <button onClick={() => handleRemove(i)} style={{ color: "#FE0000", fontWeight: "bold" }}> ✕ </button>
            </div>
        )}
    </div>
}

export default function ProfilePage() {
    const { user, profile, loading, updateUsername, refreshProfile } = useAuth();
    const [username, setUsername] = useState("");
    const [usernameError, setUsernameError] = useState(null);
    const [builds, setBuilds] = useState([]);
    const [buildsLoading, setBuildsLoading] = useState(false);
    const [lists, setLists] = useState([]);
    const [listsLoading, setListsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [flair, setFlair] = useState("");
    const [socials, setSocials] = useState([]);
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
            setSocials(profile.socials ?? []);
            setProfileLoading(false);
        }
    }, [profile]);

    const searchTab = searchParams.get('tab') ?? "published";
    const [mainActiveTab, setMainActiveTab] = useState("builds");
    const [activeTab, setActiveTab] = useState(searchTab);

    useEffect(() => {
        setActiveTab(searchTab);
    }, [searchTab]);

    useEffect(() => {
        if (mainActiveTab === "builds") {
            switch (activeTab) {
                case "published":
                    if (user) {
                        setBuildsLoading(true);
                        getFilteredBuilds({ "user_id": user.id, "ignore_block_discovery": true }, true, "recency", false, page, 24)
                            .then(b => { setBuilds(b); setBuildsLoading(false); })
                    } else {
                        setBuilds([]);
                    }
                    break;
                case "drafts":
                    if (user) {
                        setBuildsLoading(true);
                        getFilteredBuilds({ "user_id": user.id, "ignore_block_discovery": true }, false, "recency", false, page, 24)
                            .then(b => { setBuilds(b); setBuildsLoading(false); })
                    } else {
                        const fetchBuilds = async () => {
                            const builds = await buildsStore.getAll();
                            setBuilds(builds);
                        }
                        fetchBuilds();
                    }
                    break;
                case "saved":
                    if (user) {
                        setBuildsLoading(true);
                        getSavedBuilds(user.id, page, 24).then(b => { setBuilds(b); setBuildsLoading(false); })
                    } else {
                        setBuildsLoading(true);
                        const fetchSaves = async () => {
                            const saves = await savesStore.getAll();
                            getFilteredBuilds({ "build_ids": saves.map(x => x.id) }, true, "recency", false, page, 24)
                                .then(b => { setBuilds(b); setBuildsLoading(false); })
                        }
                        fetchSaves();
                    }
                    break;
                default:
                    break;
            }
        } else if (mainActiveTab === "lists") {
            switch (activeTab) {
                case "published":
                    if (user) {
                        setListsLoading(true);
                        searchCuratedLists({ "user_id": user.id, "ignore_block_discovery": true }, true, "new", page, 10)
                            .then(l => { setLists(l); setListsLoading(false); })
                    } else {
                        setLists([]);
                    }
                    break;
                case "drafts":
                    if (user) {
                        setListsLoading(true);
                        searchCuratedLists({ "user_id": user.id, "ignore_block_discovery": true }, false, "new", page, 10)
                            .then(l => { setLists(l); setListsLoading(false); })
                    } else {
                        const fetchLists = async () => {
                            const lists = await listsStore.getAll();
                            setLists(lists.map(x => ({ ...x, items: x.items.map(build => build.build) })));
                        }
                        fetchLists();
                    }
                    break;
                case "saved":
                    if (user) {
                        setListsLoading(true);
                        getSavedCuratedLists(user.id, page, 10).then(l => { setLists(l); setListsLoading(false); })
                    } else {
                        setListsLoading(true);
                        const fetchSaves = async () => {
                            const saves = await savedListsStore.getAll();
                            if (saves.length === 0) {
                                setLists([]);
                                setListsLoading(false);
                            }
                            else {
                                searchCuratedLists({ "list_ids": saves.map(x => x.id) }, true, "new", page, 10)
                                    .then(l => { setLists(l); setListsLoading(false); })
                            }
                        }
                        fetchSaves();
                    }
                    break;
                default:
                    break;
            }
        }

    }, [user, activeTab, page, mainActiveTab]);

    const socialsOptions = useMemo(() => Object.entries(socialsData).reduce((acc, [k, v]) => { acc[k] = v.label; return acc; }, {}), []);

    if (loading)
        return <div>
            <h2>Loading Profile...</h2>
        </div>;

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

        let socialsValid = true;
        for (let i = 0; i < socials.length; i++) {
            if (!socialsData[socials[i].type].validator.test(socials[i].value)) {
                socialsValid = false;
                setSocials(p => p.map((social, index) => index === i ? { ...social, invalid: true } : social));
            } else {
                if (socials[i].invalid) {
                    const { invalid, ...rest } = socials[i];
                    setSocials(p => p.map((social, index) => index === i ? rest : social));
                }
            }
        }

        if (!socialsValid) {
            setProfileError('Invalid socials');
            return;
        }

        setUpdating(true);
        await updateUser(user.id, flair.trim(), description, socials);
        setUpdating(false);

        refreshProfile();
        window.location.reload();
    };

    const headerStyle = { marginTop: "1rem", marginBottom: "0" };
    const subHeaderStyle = { fontSize: "0.8rem", color: "#aaa" };

    const addSocial = (value) => {
        setSocials(p => [...p, { type: value, value: "" }]);
    }

    const contentDisplay = () => {
        if (mainActiveTab === "builds") {
            if (buildsLoading) return <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>Loading...</p>;
            const components = [];
            if (!user) {
                if (activeTab === "drafts") {
                    components.push(<div key={"draft-warn"} style={{ color: "rgba(255, 99, 71, 0.85)", paddingBottom: "0.5rem" }}>
                        When not logged in, builds are saved locally on this device. After logging in, you can sync them to your account. Builds that are not synced cannot be accessed while logged in.
                    </div>)
                } else if (activeTab === "saved") {
                    components.push(<div key={"draft-warn"} style={{ color: "rgba(255, 99, 71, 0.85)", paddingBottom: "0.5rem" }}>
                        When not logged in, saved builds are stored locally on this device. After logging in, you can sync them to your account. Saved builds that are not synced cannot be accessed while logged in. Local drafts cannot be saved.
                    </div>)
                }
            }
            if (builds.length === 0) {
                if (page === 1) {
                    let str;
                    switch (activeTab) {
                        case "published":
                            str = user ? "No published builds yet" : "";
                            break;
                        case "drafts":
                            str = "No drafts yet";
                            break;
                        case "saved":
                            str = "No saved builds yet";
                            break;
                        default:
                            break;
                    }
                    if (str) {
                        components.push(<p key={"no-builds"} style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>
                            {str}
                        </p>)
                    }
                } else {
                    components.push(<p key={"no-builds"} style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>
                        No more builds.
                    </p>)
                }
            } else {
                components.push(
                    <div key={"content"} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <BuildsGrid builds={builds} />

                        <div style={{ display: "flex", gap: "0.5rem", alignSelf: "end" }}>
                            <button className="page-button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                            <button className="page-button" disabled={builds.length < 24} onClick={() => setPage(p => p + 1)}>Next</button>
                        </div>
                    </div>
                );
            }
            return components;
        } else if (mainActiveTab === "lists") {
            if (listsLoading) return <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>Loading...</p>;
            const components = [];
            if (!user) {
                if (activeTab === "drafts") {
                    components.push(<div key={"draft-warn"} style={{ color: "rgba(255, 99, 71, 0.85)", paddingBottom: "0.5rem" }}>
                        When not logged in, curated lists are saved locally on this device. After logging in, you can sync them to your account. Curated lists that are not synced cannot be accessed while logged in.
                    </div>)
                }
            }
            if (lists.length === 0) {
                if (page === 1) {
                    let str;
                    switch (activeTab) {
                        case "published":
                            str = user ? "No published curated lists yet" : "";
                            break;
                        case "drafts":
                            str = "No drafts yet";
                            break;
                        case "saved":
                            str = "No saved curated lists yet";
                            break;
                        default:
                            break;
                    }
                    if (str) {
                        components.push(<p key={"no-lists"} style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>
                            {str}
                        </p>)
                    }
                } else {
                    components.push(<p key={"no-lists"} style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>
                        No more builds.
                    </p>)
                }
            } else {
                components.push(
                    <div key={"content"} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {lists.map(list => <CuratedList key={list.id} list={list} />)}

                        <div style={{ display: "flex", gap: "0.5rem", alignSelf: "end" }}>
                            <button className="page-button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                            <button className="page-button" disabled={builds.length < 24} onClick={() => setPage(p => p + 1)}>Next</button>
                        </div>
                    </div>
                );
            }
            return components;
        }
    }

    return <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {user ?
            (!profileLoading ?
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "1600px" }}>
                    <h2 style={headerStyle}>Details</h2>
                    <div>
                        View your profile <NoPrefetchLink className="text-link" href={`profiles/${profile.username}`}>here</NoPrefetchLink>.
                    </div>
                    <h4 style={headerStyle}>Username</h4>
                    <span style={subHeaderStyle}>Name to display across the site. This must be updated separately from the rest of the profile.</span>
                    <div><input value={username} onChange={e => setUsername(e.target.value)} /></div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <button onClick={handleUpdateUsername} disabled={updating}>Update Username</button>
                        {usernameError}
                    </div>
                    <h4 style={headerStyle}>Flair</h4>
                    <span style={subHeaderStyle}>Add a flair to display beside or below your username.</span>
                    <div><input value={flair} onChange={e => setFlair(e.target.value)} /></div>
                    <h4 style={headerStyle}>Profile Description</h4>
                    <span style={subHeaderStyle}>The profile description will be displayed whenever someone views your profile.</span>
                    <MarkdownEditorWrapper value={description} onChange={setDescription} placeholder="Write your profile description..." short={true} />
                    <h4 style={headerStyle}>Links & Socials</h4>
                    <span style={subHeaderStyle}>Add links if you want people to find you elsewhere. These will be displayed on your profile and your builds.</span>
                    <DropdownButton setValue={addSocial} defaultDisplay={"+ Add Social"} options={socialsOptions} />
                    <SocialsComponent socials={socials} setSocials={setSocials} />
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <button onClick={handleUpdateProfile} disabled={updating}>Update Profile</button>
                        {profileError}
                    </div>
                </div> :
                <h2>Profile Loading...</h2>
            ) :
            <h2>Login to edit profile</h2>
        }

        <div style={{ border: "1px #777 solid" }} />

        <h2 style={{ display: "flex", marginBottom: "1rem", gap: "1rem" }}>
            <div style={{ cursor: "pointer", color: mainActiveTab === "builds" ? "#ddd" : "#777" }} onClick={() => { setMainActiveTab("builds"); setPage(1); }}>Builds</div>
            <div style={{ cursor: "pointer", color: mainActiveTab === "lists" ? "#ddd" : "#777" }} onClick={() => { setMainActiveTab("lists"); setPage(1); }}>Curated Lists</div>
        </h2>
        <div style={{ display: "flex", marginBottom: "1rem", gap: "1rem" }}>
            {mainActiveTab === "builds" ?
                <NoPrefetchLink href="/builds/new" style={{ textDecoration: "none" }}>
                    <div style={{ fontSize: "1.2rem", fontWeight: "bold", cursor: "pointer", color: "#777" }}>+New Build</div>
                </NoPrefetchLink> :
                <NoPrefetchLink href="/curated-lists/new" style={{ textDecoration: "none" }}>
                    <div style={{ fontSize: "1.2rem", fontWeight: "bold", cursor: "pointer", color: "#777" }}>+New Curated List</div>
                </NoPrefetchLink>
            }
            {user ?
                <div style={{ ...tabStyle, color: activeTab === "published" ? "#ddd" : "#777" }} onClick={() => { setActiveTab("published"); setPage(1); }}>Published</div> :
                null}
            <div style={{ ...tabStyle, color: activeTab === "drafts" ? "#ddd" : "#777" }} onClick={() => { setActiveTab("drafts"); setPage(1); }}>Drafts</div>
            <div style={{ ...tabStyle, color: activeTab === "saved" ? "#ddd" : "#777" }} onClick={() => { setActiveTab("saved"); setPage(1); }}>Saved</div>
        </div>

        {contentDisplay()}
    </div>
}
