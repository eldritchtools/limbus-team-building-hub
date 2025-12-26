"use client";

import { DataProvider, getMeta, GiftTooltip, StatusTooltip } from "@eldritchtools/limbus-shared-library";
import { Layout } from "@eldritchtools/shared-components";
import Link from "next/link";
import { IdentityTooltip } from "./components/IdentityTooltip";
import { EgoTooltip } from "./components/EgoTooltip";
import { GeneralTooltip } from "./components/GeneralTooltip";
import UserStatus from "./components/UserStatus";
import { AuthProvider } from "./database/authProvider";
import { useEffect, useState } from "react";
import { RequestsCacheProvider } from "./database/RequestsCacheProvider";

import TimeAgo from "javascript-time-ago"
import en from "javascript-time-ago/locale/en"

TimeAgo.addDefaultLocale(en)

const paths = [
    { path: "/builds", title: "Explore Team Builds" },
    {
        path: "/my-profile", title: "My Profile", subpaths: [
            { path: "/builds/new", title: "New Build" },
            { path: "/my-profile?tab=builds", title: "My Builds" },
            { path: "/my-profile?tab=drafts", title: "My Drafts" },
            { path: "/my-profile?tab=saved", title: "Saved Builds" },
        ]
    },
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
    }, []);

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
                    <GeneralTooltip />
                    <GiftTooltip />
                </DataProvider>
            </Layout>
        </RequestsCacheProvider>
    </AuthProvider>
}