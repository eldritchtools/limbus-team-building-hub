"use client";

import { useEffect, useMemo, useState } from "react";
import { checkUsername } from "@/app/database/users";
import { getFilteredBuilds } from "@/app/database/builds";
import React from "react";
import BuildsGrid from "@/app/components/BuildsGrid";

export default function ProfilePage({params}) {
    const { username } = React.use(params);
    const parsedUsername = useMemo(() => {
        return decodeURIComponent(username);
    }, [username]); 

    const [builds, setBuilds] = useState([]);
    const [buildsLoading, setBuildsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [userExists, setUserExists] = useState(false);
    const [checkingUser, setCheckingUser] = useState(true);

    useEffect(() => {
        checkUsername(parsedUsername).then(x => {
            if (x) setUserExists(true);
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

    return <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h2 style={{ alignSelf: "center" }}>{parsedUsername}&apos;s Builds</h2>
        <div style={{ border: "1px #777 solid" }} />
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
