"use client";

import { useMemo } from "react";
import "./tag.css";
import Link from "next/link";

export default function Tag({ tag }) {
    const path = useMemo(() => {
        const search = new URLSearchParams({ tags: [tag] });
        return `/builds/search?${search.toString()}`;
    }, [tag]);

    return <Link className="tag" href={path}>{tag}</Link>
}