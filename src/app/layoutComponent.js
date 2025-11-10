"use client";

import { DataProvider, StatusTooltip } from "@eldritchtools/limbus-shared-library";
import { Layout } from "@eldritchtools/shared-components";
import Link from "next/link";
import { IdentityTooltip } from "./components/IdentityTooltip";
import { EgoTooltip } from "./components/EgoTooltip";
import { TeamCodeTooltip } from "./components/TeamCodeTooltip";
import UserStatus from "./components/UserStatus";
import { AuthProvider } from "./database/authProvider";

const paths = [
    { path: "/builds", title: "Explore Team Builds" },
    { path: "/my-profile", title: "My Profile" },
    { path: "/identities", title: "Identities" },
    { path: "/egos", title: "E.G.Os" },
]

const description = <span>
    Limbus Company Team Building Hub is a free fan-made tool for players to create, share, and search for team builds.
    <br />
    View team builds created by other players or share your own. Look up information on identities and E.G.Os or builds that utilize them.
</span>;

export default function LayoutComponent({ children }) {
    return <AuthProvider>
        <Layout
            title={"Limbus Company Team Building Hub"}
            lastUpdated={process.env.REACT_APP_LAST_UPDATED}
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
    </AuthProvider>
}