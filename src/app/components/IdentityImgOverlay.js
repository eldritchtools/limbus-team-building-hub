import { IdentityImg, RarityImg } from "@eldritchtools/limbus-shared-library";
import "./ImgOverlay.css";

export default function IdentityImgOverlay({ identity, uptie = 4, includeName = false, includeRarity = false }) {
    return <div className="image-overlay-container">
        <div className="image-wrapper">
            <IdentityImg identity={identity} uptie={uptie} displayName={false} width={"100%"} />
        </div>
        {includeRarity ? <div className="overlay-icon-wrapper">
            <RarityImg rarity={identity.rank} style={{height: "2rem"}} />
        </div> : null}
        {includeName ? <div className="overlay-text" style={{ "--len": identity.name.length }}>
            {identity.name}
        </div> : null}
    </div>
}
