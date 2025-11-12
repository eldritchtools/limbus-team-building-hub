"use client";

import { getIdentityImgSrc, getSinnerIconSrc, useData } from '@eldritchtools/limbus-shared-library';
import React, { useRef } from 'react';
import IdentityImgSpread from './IdentityImgSpread';

const ImageStitcher = ({ identitiesList, outputFileName = "stitched_image.png" }) => {
    const canvasRef = useRef(null);
    const [identities, identitiesLoading] = useData("identities_mini");

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
                img.src = identitiesList[i] ? getIdentityImgSrc(identities[identitiesList[i]]) : getSinnerIconSrc(i + 1);
            })
        });

        try {
            await loadImages;

            canvas.width = 6 * baseSize;
            canvas.height = 2 * baseSize;

            images.forEach((img, i) => {
                if (identitiesList[i]) ctx.drawImage(img, 0, 0, img.width, img.height, (i % 6) * baseSize, Math.floor(i / 6) * baseSize, baseSize, baseSize);
                else ctx.drawImage(img, 0, 0, img.width, img.height, ((i % 6) + .125) * baseSize, (Math.floor(i / 6) + .125) * baseSize, baseSize * .75, baseSize * .75);
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
            <IdentityImgSpread identityIds={identitiesList} scale={0.5} />
            <br />

            {identitiesLoading ?
                <div>Loading options</div> :
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                    Recommended size:
                    <button onClick={() => downloadImage(128)}>{sizeStr(128)}</button>
                    &nbsp;| Other sizes:
                    <button onClick={() => downloadImage(32)}>{sizeStr(32)}</button>
                    <button onClick={() => downloadImage(64)}>{sizeStr(64)}</button>
                    <button onClick={() => downloadImage(96)}>{sizeStr(96)}</button>
                    <button onClick={() => downloadImage(256)}>{sizeStr(256)}</button>
                </div>
            }
        </div>
    );
};

export default ImageStitcher;
