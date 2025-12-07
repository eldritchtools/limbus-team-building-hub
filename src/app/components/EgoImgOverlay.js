import { EgoImg, RarityImg } from "@eldritchtools/limbus-shared-library";
import "./ImgOverlay.css";
import { affinityColorMapping } from "../utils";

export default function EgoImgOverlay({ ego, banner = false, type = "awaken", includeName = false, includeRarity = false }) {
    const bannerImgStyleOverride = {
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: null,
        aspectRatio: banner ? "4/1" : "1/1",
        objectFit: "cover"
    };

    return <div className="image-overlay-container" style={bannerImgStyleOverride}>
        <div className="image-wrapper" style={bannerImgStyleOverride}>
            <EgoImg ego={ego} type={type} displayName={false} style={bannerImgStyleOverride} width={"100%"} />
        </div>
        {includeRarity ? <div className="overlay-icon-wrapper">
            <RarityImg rarity={ego.rank.toLowerCase()} style={{ height: "1.5rem" }} />
        </div> : null}
        {includeName ? (
            banner ? <div className="overlay-text-banner" style={{ color: affinityColorMapping[ego.affinity || ego.awakeningType.affinity] }}>
                {ego.name}
            </div> : <div className="overlay-text" style={{ "--len": ego.name.length }}>
                {ego.name}
            </div>) : null}
    </div>
}
