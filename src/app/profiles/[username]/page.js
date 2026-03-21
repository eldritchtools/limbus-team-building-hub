"use client";

import { useEffect, useMemo, useState } from "react";
import { getUserDataFromUsername } from "@/app/database/users";
import { getFilteredBuilds } from "@/app/database/builds";
import React from "react";
import BuildsGrid from "@/app/components/BuildsGrid";
import MarkdownRenderer from "@/app/components/Markdown/MarkdownRenderer";
import { useBreakpoint } from "@eldritchtools/shared-components";
import SocialsDisplay from "@/app/components/SocialsDisplay";
import { tabStyle } from "@/app/styles";
import { searchCollections } from "@/app/database/collections";
import { searchMdPlans } from "@/app/database/mdPlans";
import Collection from "@/app/components/Collection";
import MdPlan from "@/app/components/MdPlan";

export default function ProfilePage({ params }) {
    const { username } = React.use(params);
    const parsedUsername = useMemo(() => {
        return decodeURIComponent(username);
    }, [username]);

    const [builds, setBuilds] = useState([]);
    const [buildsLoading, setBuildsLoading] = useState(false);
    const [collections, setCollections] = useState([]);
    const [collectionsLoading, setCollectionsLoading] = useState(false);
    const [mdPlans, setMdPlans] = useState([]);
    const [mdPlansLoading, setMdPlansLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [flair, setFlair] = useState("");
    const [description, setDescription] = useState("");
    const [socials, setSocials] = useState([]);
    const [userExists, setUserExists] = useState(false);
    const [checkingUser, setCheckingUser] = useState(true);
    const [viewMode, setViewMode] = useState("builds");
    const { isDesktop } = useBreakpoint();

    useEffect(() => {
        getUserDataFromUsername(parsedUsername).then(x => {
            if (x) {
                setUserExists(true);
                setFlair(x.flair ?? "");
                setDescription(x.description ?? "");
                setSocials(x.socials ?? []);
            }
            else setUserExists(false);
            setCheckingUser(false);
        })
    }, [parsedUsername]);

    useEffect(() => {
        if (viewMode === "builds") {
            setBuildsLoading(true);
            getFilteredBuilds({ "username_exact": parsedUsername, "ignore_block_discovery": true }, true, "recency", false, page, 24)
                .then(b => { setBuilds(b); setBuildsLoading(false); })
        } else if (viewMode === "collections") {
            setCollectionsLoading(true);
            searchCollections({ "username_exact": parsedUsername, "ignore_block_discovery": true }, true, "new", page, 10)
                .then(c => { setCollections(c); setCollectionsLoading(false); })
        } else if (viewMode === "md_plans") {
            setMdPlansLoading(true);
            searchMdPlans({ username: parsedUsername, ignoreBlockDiscovery: true, sortBy: "new", published: true, limit: 20, offset: (page - 1) * 20 })
                .then(p => { setMdPlans(p); setMdPlansLoading(false); })
        }
    }, [parsedUsername, page, viewMode]);

    if (checkingUser) {
        return <div style={{ display: "flex", flexDirection: "column" }}>
            <h2>Checking user {parsedUsername}</h2>
        </div>
    }

    if (!userExists) {
        return <div style={{ display: "flex", flexDirection: "column" }}>
            <h2>User {parsedUsername} not found</h2>
        </div>
    }

    const contentDisplay = () => {
        if (viewMode === "builds") {
            if (buildsLoading) return <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>Loading...</p>;
            if (builds.length === 0) {
                return <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>
                    {page === 1 ? "No published builds yet." : "No more builds."}
                </p>;
            } else {
                return <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <BuildsGrid builds={builds} />

                    <div style={{ display: "flex", gap: "0.5rem", alignSelf: "end" }}>
                        <button className="page-button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                        <button className="page-button" disabled={builds.length < 24} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                </div>;
            }
        } else if (viewMode === "collections") {
            if (collectionsLoading) return <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>Loading...</p>;
            if (collections.length === 0) {
                return <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>
                    {page === 1 ? "No published collections yet." : "No more collections."}
                </p>;
            } else {
                return <div key={"content"} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {collections.map(collection => <Collection key={collection.id} collection={collection} />)}

                    <div style={{ display: "flex", gap: "0.5rem", alignSelf: "end" }}>
                        <button className="page-button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                        <button className="page-button" disabled={collections.length < 10} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                </div>;
            }
        } else if (viewMode === "md_plans") {
            if (mdPlansLoading) return <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>Loading...</p>;
            if (mdPlans.length === 0) {
                return <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>
                    {page === 1 ? "No published md plans yet." : "No more md plans."}
                </p>;
            } else {
                return <div key={"content"} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {mdPlans.map(plan => <MdPlan key={plan.id} plan={plan} />)}

                    <div style={{ display: "flex", gap: "0.5rem", alignSelf: "end" }}>
                        <button className="page-button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                        <button className="page-button" disabled={mdPlans.length < 10} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                </div>;
            }
        }
    }

    return <div style={{display: "flex", justifyContent: "center"}}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: isDesktop ? "90%" : "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
            <h2 style={{ marginBottom: "0" }}>{parsedUsername}</h2>
            <div><em>{flair}</em></div>
            {socials.length > 0 ? <SocialsDisplay socials={socials} /> : null}
            <div style={{ width: isDesktop ? "70%" : "90%" }}> <MarkdownRenderer content={description} /></div>
        </div>
        <div style={{ alignSelf: "center", border: "1px #777 solid", width: "100%" }} />

        <div style={{ display: "flex", marginTop: "0.5rem", marginBottom: "1rem", gap: "1rem", justifyContent: "center" }}>
            <div style={{ ...tabStyle, color: viewMode === "builds" ? "#ddd" : "#777" }} onClick={() => { setViewMode("builds"); setPage(1); }}>Builds</div>
            <div style={{ ...tabStyle, color: viewMode === "collections" ? "#ddd" : "#777" }} onClick={() => { setViewMode("collections"); setPage(1); }}>Collections</div>
            <div style={{ ...tabStyle, color: viewMode === "md_plans" ? "#ddd" : "#777" }} onClick={() => { setViewMode("md_plans"); setPage(1); }}>MD Plans</div>
        </div>

        {contentDisplay()}
    </div>
    </div>
}
