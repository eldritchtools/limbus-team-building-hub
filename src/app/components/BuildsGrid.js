import { useEffect, useState } from "react";
import BuildEntry from "./BuildEntry";

export default function BuildsGrid({ builds }) {
    const [compressed, setCompressed] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("buildsCompressed");
        setCompressed(saved ? JSON.parse(saved) : false);
    }, []);

    const handleCompressedToggle = (checked) => {
        localStorage.setItem("buildsCompressed", JSON.stringify(checked));
        setCompressed(checked);
    }

    return <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ alignSelf: "center" }}>
            <label>
                <input type="checkbox" checked={compressed} onChange={e => handleCompressedToggle(e.target.checked)} />
                Compressed View
            </label>
        </div>

        {compressed ?
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 450px)", gap: "0.5rem", justifyContent: "center" }}>
                {builds.map(build => <BuildEntry key={build.id} build={build} minified={true} minifull={true} />)}
            </div> :
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 640px)", gap: "0.5rem", justifyContent: "center" }}>
                {builds.map(build => <BuildEntry key={build.id} build={build} />)}
            </div>
        }
    </div>
}
