"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

import "easymde/dist/easymde.min.css";
import "codemirror/theme/monokai.css";
import "./MarkdownEditor.css";

import dynamic from "next/dynamic";
const SimpleMDE = dynamic(() => import("react-simplemde-editor"), { ssr: false });

export default function MarkdownEditor({ value, onChange, placeholder, short=false }) {
    const [mode, setMode] = useState("edit");
    const modeStyle = { fontSize: "1rem", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s" };

    const mdeOptions = useMemo(() => {
        return {
            theme: "monokai",
            spellChecker: false,
            autofocus: false,
            placeholder: placeholder,
            status: false,
            toolbar: [
                "bold", "italic", "heading", "|",
                "quote", "unordered-list", "ordered-list", "|",
                "link", "image", "|",
                "guide"
            ],
            minHeight: short ? "10rem" : "20rem",
            width: "100%"
        };
    }, [short, placeholder]);

    return <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
        <div style={{ display: "flex", marginBottom: "0.5rem", gap: "1rem" }}>
            <div style={{ ...modeStyle, color: mode === "edit" ? "#ddd" : "#777" }} onClick={() => setMode("edit")}>Edit</div>
            <div style={{ ...modeStyle, color: mode === "preview" ? "#ddd" : "#777" }} onClick={() => setMode("preview")}>Preview</div>
        </div>
        {mode === "edit" ? <SimpleMDE value={value} onChange={onChange} options={mdeOptions} /> : null}
        {mode === "preview" ? <MarkdownRenderer content={value} /> : null}
        {mode === "edit" ?
            <div style={{ fontSize: "0.8rem" }}>You can reference things like statuses and keywords with tokens like {"{keyword:Burn}"} to show icons or tooltips when hovering over them.&nbsp;
                <Link href={"/markdown-tokens"} target="_blank" rel="noopener noreferrer">Click here</Link> for more details.</div>
            : null
        }
    </div>
}