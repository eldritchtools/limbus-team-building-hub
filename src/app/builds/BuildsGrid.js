import { useEffect, useState } from "react";
import BuildEntry from "../components/BuildEntry";

export default function BuildsGrid({ builds }) {
    const [compressed, setCompressed] = useState(() => {
        const saved = localStorage.getItem("buildsCompressed");
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        localStorage.setItem("buildsCompressed", JSON.stringify(compressed));
    }, [compressed]);

    return <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <label>
            <input type="checkbox" checked={compressed} onChange={e => setCompressed(e.target.checked)} />
            Compressed View
        </label>

        {compressed ?
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 450px)", gap: "0.5rem", justifyContent: "center" }}>
                {builds.map(build => <BuildEntry key={build.id} build={build} minified={true} />)}
            </div> :
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 640px)", gap: "0.5rem", justifyContent: "center" }}>
                {builds.map(build => <BuildEntry key={build.id} build={build} />)}
            </div>
        }
    </div>
}
