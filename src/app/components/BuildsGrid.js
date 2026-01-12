import { useEffect, useState } from "react";
import BuildEntry from "./BuildEntry";
import { useBreakpoint } from "@eldritchtools/shared-components";

export default function BuildsGrid({ builds }) {
    const [compressed, setCompressed] = useState(false);
    const { isMobile } = useBreakpoint();

    useEffect(() => {
        const saved = localStorage.getItem("buildsCompressed");
        setCompressed(saved ? JSON.parse(saved) : false);
    }, []);

    const handleCompressedToggle = (checked) => {
        localStorage.setItem("buildsCompressed", JSON.stringify(checked));
        setCompressed(checked);
    }

    return <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {!isMobile ?
            <div style={{ alignSelf: "center" }}>
                <label>
                    <input type="checkbox" checked={compressed} onChange={e => handleCompressedToggle(e.target.checked)} />
                    Compressed View
                </label>
            </div> : null}

        {isMobile ?
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 300px)", gap: "1rem", justifyContent: "center" }}>
                {builds.map(build => <BuildEntry key={build.id} build={build} size={"S"} />)}
            </div> :
            compressed ?
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 460px)", gap: "1rem", justifyContent: "center" }}>
                    {builds.map(build => <BuildEntry key={build.id} build={build} size={"M"} />)}
                </div> :
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 640px)", gap: "1rem", justifyContent: "center" }}>
                    {builds.map(build => <BuildEntry key={build.id} build={build} size={"L"} />)}
                </div>
        }
    </div>
}
