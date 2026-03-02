'use client';

import { EgoImg, IdentityImg, useData } from "@eldritchtools/limbus-shared-library";
import Link from "next/link";
import { useMemo } from "react";

export default function Home() {
    const [identities, identitiesLoading] = useData("identities");
    const [egos, egosLoading] = useData("egos");

    const latest = useMemo(() => {
        if (identitiesLoading || egosLoading) return [];
        const dates = {};

        Object.values(identities).forEach(x => {
            if (!(x.date in dates)) dates[x.date] = [x];
            else dates[x.date].push(x);
        });
        Object.values(egos).forEach(x => {
            if (!(x.date in dates)) dates[x.date] = [x];
            else dates[x.date].push(x);
        });

        const latest = Object.keys(dates).sort((a, b) => b.localeCompare(a)).slice(0, 10);
        return Object.fromEntries(latest.map(x => [x, dates[x]]));
    }, [identities, identitiesLoading, egos, egosLoading]);

    return <div style={{ display: "flex", flexDirection: "column", marginTop: "2rem", alignItems: "center", textAlign: "center", width: "100%", gap: "0.5rem"}}>
        <h2 style={{ margin: 0 }}>Welcome to the Team Building Hub, Manager!</h2>
        <p>
            The Team Building Hub is a place for managers to create, share, and discover team builds.
            <br /> <br />
            Use the sidebar or click on the links below to get started.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", border: "1px solid #aaa", borderRadius: "0.5rem", padding: "1rem", gap: "1rem" }}>
            <Link className="text-link" href={"/builds"}>Search Builds</Link>
            <Link className="text-link" href={"/builds/new"}>Create a build</Link>
            <Link className="text-link" href={"/identities"}>Identities</Link>
            <Link className="text-link" href={"/egos"}>E.G.Os</Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column", border: "1px solid #aaa", borderRadius: "0.5rem", alignItems: "start", gap: "0.5rem", padding: "1rem", maxWidth: "1200px" }}>
            <h3 style={{ margin: 0 }}>Latest Additions</h3>
            {identitiesLoading || egosLoading ? null :
                <div style={{ maxWidth: "100%", overflowX: "auto", overflowY: "hidden" }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        {Object.entries(latest).map(([date, list]) =>
                            <div key={date} style={{ display: "flex", flexDirection: "column", gap: "0.2rem", alignItems: "start" }}>
                                <div>{date}</div>
                                <div style={{ display: "flex" }}>
                                    {list.map(obj => obj.id[0] === "1" ?
                                        <Link key={obj.id} href={`/identities/${obj.id}`}>
                                            <div style={{ width: "128px", height: "128px" }}>
                                                <IdentityImg identity={obj} uptie={4} displayName={true} displayRarity={true} />
                                            </div>
                                        </Link> :
                                        <Link key={obj.id} href={`/egos/${obj.id}`}>
                                            <div style={{ width: "128px", height: "128px" }}>
                                                <EgoImg ego={obj} type={"awaken"} displayName={true} displayRarity={true} />
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            </div>)}
                    </div>
                </div>
            }
        </div>
    </div>
}