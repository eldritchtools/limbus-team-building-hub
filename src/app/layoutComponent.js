"use client";

import { DataProvider, getMeta, StatusTooltip } from "@eldritchtools/limbus-shared-library";
import { Layout } from "@eldritchtools/shared-components";
import Link from "next/link";
import { IdentityTooltip } from "./components/IdentityTooltip";
import { EgoTooltip } from "./components/EgoTooltip";
import { TeamCodeTooltip } from "./components/TeamCodeTooltip";
import UserStatus from "./components/UserStatus";
import { AuthProvider } from "./database/authProvider";
import { useEffect, useState } from "react";
import { RequestsCacheProvider } from "./database/RequestsCacheProvider";

const paths = [
    { path: "/builds", title: "Explore Team Builds" },
    { path: "/my-profile", title: "My Profile" },
    { path: "/identities", title: "Identities" },
    { path: "/egos", title: "E.G.Os" },
]

const description = <span>
    Limbus Company Team Building Hub is a free fan-made tool for players to create, share, and search for team builds.
    References are also available for players to look up information on identities and E.G.Os.
</span>;

export default function LayoutComponent({ children }) {
    const [lastUpdated, setLastUpdated] = useState(process.env.NEXT_PUBLIC_LAST_UPDATED);

    useEffect(() => {
        getMeta().then(meta => setLastUpdated(p => p > meta.datetime ? p : meta.datetime));
    }, [])

    return <AuthProvider>
        <RequestsCacheProvider>
            <Layout
                title={"Limbus Company Team Building Hub"}
                lastUpdated={lastUpdated}
                linkSet={"limbus"}
                description={description}
                gameName={"Limbus Company"}
                developerName={"Project Moon"}
                githubLink={"https://github.com/eldritchtools/limbus-team-building-hub"}
                paths={paths}
                LinkComponent={Link}
                topComponent={<UserStatus />}
            >
                <DataProvider>
                    {children}
                    <StatusTooltip />
                    <IdentityTooltip />
                    <EgoTooltip />
                    <TeamCodeTooltip />
                </DataProvider>
            </Layout>
        </RequestsCacheProvider>
    </AuthProvider>
}