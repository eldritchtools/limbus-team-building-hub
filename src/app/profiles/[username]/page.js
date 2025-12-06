"use client";

import { useEffect, useState } from "react";
import { checkUsername } from "@/app/database/users";
import BuildEntry from "@/app/components/BuildEntry";
import { getFilteredBuilds } from "@/app/database/builds";
import React from "react";

export default function ProfilePage({params}) {
    const { username } = React.use(params);
    const [builds, setBuilds] = useState([]);
    const [buildsLoading, setBuildsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [userExists, setUserExists] = useState(false);
    const [checkingUser, setCheckingUser] = useState(true);

    useEffect(() => {
        checkUsername(username).then(x => {
            if (x) setUserExists(true);
            else setUserExists(false);
            setCheckingUser(false);
        })
    }, [username]);

    useEffect(() => {
        setBuildsLoading(true);
        getFilteredBuilds({ "username_exact": username }, true, "recency", false, page, 24).then(b => { setBuilds(b); setBuildsLoading(false); })
    }, [username, page]);

    if (checkingUser) {
        return <div style={{ display: "flex", flexDirection: "column" }}>
            <h2>Checking user {username}</h2>
        </div>
    }

    if (!userExists) {
        return <div style={{ display: "flex", flexDirection: "column" }}>
            <h2>User {username} not found</h2>
        </div>
    }

    return <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h2 style={{ alignSelf: "center" }}>{username}&apos;s Builds</h2>
        <div style={{ border: "1px #777 solid" }} />
        {buildsLoading ?
            <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>Loading...</p> :
            builds.length === 0 ?
                <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>
                    {page === 1 ? "No published builds yet." : "No more builds."}
                </p> :
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 640px)", gap: "0.5rem", justifyContent: "center" }}>
                        {builds.map(build => <BuildEntry key={build.id} build={build} />)}
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", alignSelf: "end" }}>
                        <button className="page-button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                        <button className="page-button" disabled={builds.length < 24} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                </div>
        }

    </div>
}
