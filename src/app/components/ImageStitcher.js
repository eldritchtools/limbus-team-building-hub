"use client";

import { getIdentityImgSrc, getSinnerIconSrc, useData } from '@eldritchtools/limbus-shared-library';
import React, { useMemo, useRef, useState } from 'react';
import IdentityImgSpread from './IdentityImgSpread';
import { decodeBuildExtraOpts } from './BuildExtraOpts';

const ImageStitcher = ({ build, outputFileName = "stitched_image.png" }) => {
    const canvasRef = useRef(null);
    const [identities, identitiesLoading] = useData("identities_mini");
    const [includeOrder, setIncludeOrder] = useState(false);
    const identitiesList = build.identity_ids;

    let identityUpties = useMemo(() => {
        if (build.extra_opts) {
            const extraOpts = decodeBuildExtraOpts(build.extra_opts, ["iu"])
            if (extraOpts.identityUpties) return extraOpts.identityUpties;
        }
        return null;
    }, [build.extra_opts]);

    const stitchImages = async (baseSize) => {
        const canvas = document.createElement("canvas");
        canvasRef.current = canvas;
        const ctx = canvas.getContext('2d');

        const images = identitiesList.map(_ => new Image());
        images.forEach(img => img.crossOrigin = "Anonymous");

        const loadImages = new Promise((resolve, reject) => {
            let loadedCount = 0;
            let imgGoal = identitiesList.length;
            const onImageLoad = () => {
                loadedCount++;
                if (loadedCount === imgGoal) resolve();
            };
            const onImageError = (err) => reject(err);

            images.forEach((img, i) => {
                img.onload = onImageLoad;
                img.onerror = onImageError;
                img.src = identitiesList[i] ? getIdentityImgSrc(identities[identitiesList[i]], identityUpties && identityUpties[i] !== "" ? identityUpties[i] : 4) : getSinnerIconSrc(i + 1);
            })
        });

        try {
            await loadImages;

            canvas.width = 6 * baseSize;
            canvas.height = 2 * baseSize;

            const emptyNudge = .125 * baseSize;

            images.forEach((img, i) => {
                const x = (i % 6) * baseSize;
                const y = Math.floor(i / 6) * baseSize;

                if (identitiesList[i]) ctx.drawImage(img, 0, 0, img.width, img.height, x, y, baseSize, baseSize);
                else ctx.drawImage(img, 0, 0, img.width, img.height, x + emptyNudge, y + emptyNudge, baseSize * .75, baseSize * .75);

                if (!includeOrder) return;
                const index = build.deployment_order.indexOf(i + 1);
                if (index === -1) return;

                const color = index < build.active_sinners ? "rgba(254, 254, 61, 1)" : "rgba(41, 254, 233, 1)";
                const num = index + 1;
                const textWidth = ctx.measureText(num).width;

                ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                ctx.fillRect(x - textWidth / 2 + 8, y + 6, textWidth + 2, 16);

                ctx.font = `bold 16px Arial`;
                ctx.fillStyle = color;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                ctx.fillText(num, x + 9, y + 15);
            })

        } catch (error) {
            console.error("Error loading images or a CORS issue occurred:", error);
            alert("Failed to load images. Check console for CORS errors. Images must be from the same domain or have appropriate CORS headers.");
        }
    };

    const downloadImage = async (baseSize) => {
        await stitchImages(baseSize);
        const canvas = canvasRef.current;

        const link = document.createElement('a');
        link.download = outputFileName;
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    const sizeStr = baseSize => `${baseSize * 6}x${baseSize * 2}`;
    return (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center", gap: "0.2rem" }}>
            <div style={{ alignSelf: "start" }}>Download team build image</div>
            {
                includeOrder ?
                    <IdentityImgSpread identityIds={identitiesList} scale={0.5} deploymentOrder={build.deployment_order} activeSinners={build.active_sinners} identityUpties={identityUpties} /> :
                    <IdentityImgSpread identityIds={identitiesList} scale={0.5} identityUpties={identityUpties} />
            }
            <br />

            {identitiesLoading ?
                <div>Loading options</div> :
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                        Recommended size:
                        <button onClick={() => downloadImage(128)}>{sizeStr(128)}</button>
                        &nbsp;| Other sizes:
                        <button onClick={() => downloadImage(64)}>{sizeStr(64)}</button>
                        <button onClick={() => downloadImage(96)}>{sizeStr(96)}</button>
                        <button onClick={() => downloadImage(256)}>{sizeStr(256)}</button>
                    </div>
                    <div style={{ display: "flex" }}>
                        <label>
                            <input type="checkbox" checked={includeOrder} onChange={() => setIncludeOrder(p => !p)} />
                            Include deployment order?
                        </label>
                    </div>
                </div>
            }
        </div>
    );
};

export default ImageStitcher;
