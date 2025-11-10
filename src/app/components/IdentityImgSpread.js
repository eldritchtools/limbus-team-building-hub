import { IdentityImg, SinnerIcon } from "@eldritchtools/limbus-shared-library";

export default function IdentityImgSpread({ identityIds, scale }) {
    const size = scale * 256;
    return <div style={{ display: "grid", gridTemplateColumns: `repeat(6, ${size}px)`, gridTemplateRows: `repeat(2, ${size}px)`, width: `${size * 6}px`, alignItems: "center", justifyItems: "center" }}>
        {identityIds.map((id, i) => id ?
            <IdentityImg key={i} id={id} scale={scale} /> :
            <SinnerIcon key={i} num={i + 1} style={{ height: `${size*.75}px` }} />)}
    </div>
}