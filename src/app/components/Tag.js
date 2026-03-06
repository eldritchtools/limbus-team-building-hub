"use client";

import { useMemo } from "react";
import "./tag.css";
import Link from "next/link";

export default function Tag({ tag, type }) {
    const path = useMemo(() => {
        const search = new URLSearchParams({ tags: [tag] });
        return `/${type}/search?${search.toString()}`;
    }, [tag, type]);

    return <Link className="tag" href={path}>{tag}</Link>
}