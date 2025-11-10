"use client";

import { DataProvider, StatusTooltip } from "@eldritchtools/limbus-shared-library";
import "./globals.css";
import { Layout } from "@eldritchtools/shared-components";
import Link from "next/link";
import { IdentityTooltip } from "./components/IdentityTooltip";
import { EgoTooltip } from "./components/EgoTooltip";
import { TeamCodeTooltip } from "./components/TeamCodeTooltip";
import UserStatus from "./components/UserStatus";
import { AuthProvider } from "./database/authProvider";
import Script from "next/script";

export const metadata = {
    title: "Limbus Company Team Building Hub",
    description: "View team builds or create your own to share. Look up relevant information on identities and E.G.Os",
    metadataBase: new URL("https://limbus-builds.eldritchtools.com"),
    alternates: {
        canonical: "/",
    }
};

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

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="manifest" href="/manifest.json" />
                <link rel="icon" href="/favicon.ico" />
                <Script async src="https://www.googletagmanager.com/gtag/js?id=G-XZJ5KQTJJ9" />
                <Script id="google-analytics">
                    {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());

                    gtag('config', 'G-XZJ5KQTJJ9', {page_path: window.location.pathname});
                    `}
                </Script>
            </head>
            <body style={{ display: "flex", flexDirection: "column" }} className={`antialiased`}>
                <AuthProvider>
                    <Layout
                        title={"Limbus Company Team Building Hub"}
                        lastUpdated={process.env.REACT_APP_LAST_UPDATED}
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
            </body>
        </html>
    );
}
