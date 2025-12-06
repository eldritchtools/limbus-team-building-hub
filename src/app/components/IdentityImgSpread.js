import { IdentityImg, SinnerIcon } from "@eldritchtools/limbus-shared-library";

function DeploymentPosition({ sinnerId, deploymentOrder, activeSinners }) {
    const index = deploymentOrder.indexOf(sinnerId);

    if (index === -1) return null;

    const color = index < activeSinners ? "#fefe3d" : "#29fee9";
    const num = index + 1;

    return <div style={{
        position: "absolute",
        top: "5px",
        left: "5px",
        textShadow: "1px 1px 4px #000, -1px 1px 4px #000, 1px -1px 4px #000, -1px -1px 4px #000, 0px 0px 8px rgba(0, 0, 0, 0.5), 0px 0px 12px rgba(0, 0, 0, 0.25)",
        color: color,
        fontWeight: "bold"
    }}>
        {num}
    </div>
}

export default function IdentityImgSpread({ identityIds, scale, deploymentOrder = [], activeSinners = 0 }) {
    const size = scale * 256;
    return <div style={{ display: "grid", gridTemplateColumns: `repeat(6, ${size}px)`, gridTemplateRows: `repeat(2, ${size}px)`, width: `${size * 6}px`, alignItems: "center", justifyItems: "center" }}>
        {identityIds.map((id, i) => <div key={id} style={{ position: "relative", width: "100%", height: "100%" }}>
            {id ?
                <IdentityImg key={i} id={id} scale={scale} /> :
                <SinnerIcon key={i} num={i + 1} style={{ height: `${size * .75}px` }} />}

            <DeploymentPosition sinnerId={i + 1} deploymentOrder={deploymentOrder} activeSinners={activeSinners} />
        </div>
        )}
    </div>
}
