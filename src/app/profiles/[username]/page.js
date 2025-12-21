"use client";

import { useEffect, useMemo, useState } from "react";
import { getUserFromUsername } from "@/app/database/users";
import { getFilteredBuilds } from "@/app/database/builds";
import React from "react";
import BuildsGrid from "@/app/components/BuildsGrid";
import MarkdownRenderer from "@/app/components/Markdown/MarkdownRenderer";
import { useBreakpoint } from "@eldritchtools/shared-components";

export default function ProfilePage({ params }) {
    const { username } = React.use(params);
    const parsedUsername = useMemo(() => {
        return decodeURIComponent(username);
    }, [username]);

    const [builds, setBuilds] = useState([]);
    const [buildsLoading, setBuildsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [flair, setFlair] = useState("");
    const [description, setDescription] = useState("");
    const [userExists, setUserExists] = useState(false);
    const [checkingUser, setCheckingUser] = useState(true);
    const { isDesktop } = useBreakpoint();

    useEffect(() => {
        getUserFromUsername(parsedUsername).then(x => {
            if (x) {
                setUserExists(true);
                setFlair(x.flair ?? "");
                setDescription(x.description ?? "");
            }
            else setUserExists(false);
            setCheckingUser(false);
        })
    }, [parsedUsername]);

    useEffect(() => {
        setBuildsLoading(true);
        getFilteredBuilds({ "username_exact": parsedUsername }, true, "recency", false, page, 24).then(b => { setBuilds(b); setBuildsLoading(false); })
    }, [parsedUsername, page]);

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

    return <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
        <h2 style={{ marginBottom: "0" }}>{parsedUsername}&apos;s Builds</h2>
        <div ><em>{flair}</em></div>
        <div style={{ width: isDesktop ? "70%" : "90%" }}> <MarkdownRenderer content={description} /></div>
        <div style={{ border: "1px #777 solid", width: "90%" }} />
        {buildsLoading ?
            <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>Loading...</p> :
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
                </div>
        }

    </div>
}
