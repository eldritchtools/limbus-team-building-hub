"use client";

import Link from "next/link";
import { useMemo } from "react";
import { constructMdeOptions } from "../styles";

import dynamic from "next/dynamic";
const SimpleMDE = dynamic(() => import("react-simplemde-editor"), { ssr: false });

export default function MarkdownEditor({ value, onChange, placeholder }) {
    const mdeOptions = useMemo(() => { return { ...constructMdeOptions(placeholder), height: "auto", minHeight: "10rem", maxHeight: "20rem" }; }, [placeholder]);

    return <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
        <SimpleMDE value={value} onChange={onChange} options={mdeOptions} />
        <div style={{ fontSize: "0.8rem" }}>You can reference things like statuses and keywords with tokens like {"{keyword:Burn}"}.&nbsp;
            <Link href={"/markdown-tokens"} target="_blank" rel="noopener noreferrer">Click here</Link> for more details.
            These tokens won&apos;t work in the preview, but will work once posted.</div>
    </div>
}