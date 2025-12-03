import { IdentityImg, SinnerIcon } from "@eldritchtools/limbus-shared-library";

export default function IdentityImgSpread({ identityIds, scale }) {
    const size = scale * 256;
    return <div style={{ display: "grid", gridTemplateColumns: `repeat(6, ${size}px)`, gridTemplateRows: `repeat(2, ${size}px)`, width: `${size * 6}px`, alignItems: "center", justifyItems: "center" }}>
        {identityIds.map((id, i) => <div key={id} style={{ position: "relative", width: "100%", height: "100%" }}>
            {id ?
                <IdentityImg key={i} id={id} scale={scale} /> :
                <SinnerIcon key={i} num={i + 1} style={{ height: `${size * .75}px` }} />}

            {/* <div style={{
                position: "absolute", 
                top: "5px", 
                left: "5px", 
                textShadow: "1px 1px 4px #000, -1px 1px 4px #000, 1px -1px 4px #000, -1px -1px 4px #000, 0px 0px 8px rgba(0, 0, 0, 0.5), 0px 0px 12px rgba(0, 0, 0, 0.25)"
                }}>
            </div> */}
        </div>
        )}
    </div>
}



// function IdentityProfile({ identity, displayType }) {
//     return identity && displayType !== null ? <Link href={`/identities/${identity.id}`}>
//         <div style={{ position: "relative", width: "100%" }} data-tooltip-id="identity-tooltip" data-tooltip-content={identity.id}>
//             <IdentityImg identity={identity} uptie={4} displayName={false} width={"100%"} />
//             {displayType === 1 ? <div style={{
//                 position: "absolute",
//                 bottom: "5px",
//                 right: "5px",
//                 textAlign: "right",
//                 textWrap: "balance",
//                 textShadow: "1px 1px 4px #000, -1px 1px 4px #000, 1px -1px 4px #000, -1px -1px 4px #000, 0px 0px 8px rgba(0, 0, 0, 0.5), 0px 0px 12px rgba(0, 0, 0, 0.25)",
//                 color: "#ddd"
//             }}>
//                 {identity.name}
//             </div> : null}
//             {displayType === 2 ? <div style={{ position: "absolute", width: "100%", aspectRatio: "1/1", background: "rgba(0, 0, 0, 0.65)", top: 0, left: 0 }}>
//                 <div style={{ display: "grid", gridTemplateRows: "repeat(4, 1fr)", width: "100%", height: "100%", justifyContent: "center" }}>
//                     {[0, 1, 2].map(x => <div key={x} style={{ display: "flex", justifyContent: "center" }}><SkillTypes skillType={identity.skillTypes[x].type} /></div>)}
//                     {<SkillTypes key={3} skillType={identity.defenseSkillTypes[0].type} />}
//                 </div>
//             </div>
//                 : null
//             }
//         </div>
//     </Link > : <div style={{ width: "100%", aspectRatio: "1/1", boxSizing: "border-box" }} />
// }