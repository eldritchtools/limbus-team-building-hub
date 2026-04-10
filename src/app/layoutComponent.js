"use client";

import { DataProvider, getMeta, GiftTooltip, StatusTooltip } from "@eldritchtools/limbus-shared-library";
import { Layout } from "@eldritchtools/shared-components";
import { IdentityTooltip } from "./components/IdentityTooltip";
import { EgoTooltip } from "./components/EgoTooltip";
import { GeneralTooltip } from "./components/GeneralTooltip";
import UserStatus from "./components/UserStatus";
import { AuthProvider } from "./database/authProvider";
import { useEffect, useState } from "react";
import { RequestsCacheProvider } from "./database/RequestsCacheProvider";

import TimeAgo from "javascript-time-ago"
import en from "javascript-time-ago/locale/en"
import { CalcTooltip } from "./components/CalcTooltip";
import NoPrefetchLink from "./NoPrefetchLink";

TimeAgo.addDefaultLocale(en);

const paths = [
    { path: "/", title: "Home" },
    { path: "/builds", title: "Team Builds" },
    { path: "/md-plans", title: "MD Plans" },
    { path: "/collections", title: "Collections" },
    { path: "/my-profile", title: "My Profile" },
    { path: "/identities", title: "Identities" },
    { path: "/egos", title: "E.G.Os" },
]

const description = <span>
    Limbus Company Team Building Hub is a free fan-made tool for players to create, share, and search for team builds.
    References are also available for players to look up information on identities and E.G.Os.
</span>;

function MigrationNotice() {
    const [hidden, setHidden] = useState(false);

    if (hidden) return null;

    return <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ backgroundColor: "#262626", borderBottom: "1px solid #333", maxWidth: "1200px", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
            <div style={{ padding: "8px 16px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#d1d1d1" }}>
                    <span style={{ lineHeight: "1.3" }}>
                        Hi! This site has been combined with the Mirror Dungeon site to make a more convenient and easier to maintain site over at <NoPrefetchLink className="text-link" href="https://limbus.eldritchtools.com">https://limbus.eldritchtools.com</NoPrefetchLink>.
                        <br /> <br />
                        All data synced to accounts is automatically carried over, you only need to login again in the new site. If you&apos;re not using an account, it&apos;s recommended to sync your data to an account or to transfer them to the other site when possible. Sorry for the inconvenience!
                        <br /> <br />
                        This site will continue running for some time, but will only receive updates for compatibility with new data. Only the new site will receive new features moving forward. 
                    </span>
                </div>

                <button 
                    style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: "1.2rem", fontWeight: "bold" }} 
                    onClick={() => setHidden(true)}
                >
                    ✕
                </button>
            </div>
        </div>
    </div>;
}

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
                LinkComponent={NoPrefetchLink}
                topComponent={<UserStatus />}
            >
                <DataProvider>
                    <MigrationNotice />
                    {children}
                    <StatusTooltip />
                    <IdentityTooltip />
                    <EgoTooltip />
                    <GeneralTooltip />
                    <GiftTooltip />
                    <CalcTooltip />
                </DataProvider>
            </Layout>
        </RequestsCacheProvider>
    </AuthProvider>
}