"use client";

import Link from "next/link";
import { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

import MarkdownEditorMain from "./MarkdownEditorMain";

export default function MarkdownEditorWrapper({ value, onChange, placeholder, short = false }) {
    const [mode, setMode] = useState("edit");
    const modeStyle = { fontSize: "1rem", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s" };

    return <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
        <div style={{ display: "flex", marginBottom: "0.5rem", gap: "1rem" }}>
            <div style={{ ...modeStyle, color: mode === "edit" ? "#ddd" : "#777" }} onClick={() => setMode("edit")}>Edit</div>
            <div style={{ ...modeStyle, color: mode === "preview" ? "#ddd" : "#777" }} onClick={() => setMode("preview")}>Preview</div>
        </div>
        {mode === "edit" ? <MarkdownEditorMain value={value} onChange={onChange} placeholder={placeholder} short={short} /> : null}
        {mode === "preview" ? <MarkdownRenderer content={value} /> : null}
        {mode === "edit" ?
            <div style={{ fontSize: "0.8rem" }}>You can reference things like statuses and keywords with tokens like {"{keyword:Burn}"} to show icons or tooltips when hovering over them.&nbsp;
                <Link href={"/markdown-tokens"} target="_blank" rel="noopener noreferrer">Click here</Link> for more details. 
                An autocomplete system is available for the following token types: identity, ego, status, giftname, gifticons, keyword, sinner. To trigger it, just start typing {"\"{type:\""}.</div>
            : null
        }
    </div>
}