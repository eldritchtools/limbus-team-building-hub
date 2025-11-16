"use client";

import { Icon, Status, useData } from "@eldritchtools/limbus-shared-library";
import { keywordIconConvert } from "../keywordIds";
import { sinnerMapping } from "../utils";
import { Tooltip } from "react-tooltip";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { visit } from "unist-util-visit";
import { useEffect, useMemo, useState } from "react";
import { getFilteredBuilds } from "../database/builds";
import { tooltipStyle } from "../styles";
import BuildEntry from "./BuildEntry";

function tokenExtractionPlugin() {
    return (tree) => {
        visit(tree, "text", (node, index, parent) => {
            const regex = /(?<!\\)\{([^:{}\n]+):([^{}\n]+)\}(?!\\)/g;
            const parts = [];
            let lastIndex = 0;
            let match;

            const value = node.value;
            while ((match = regex.exec(value)) !== null) {
                const before = value.slice(lastIndex, match.index);
                if (before) parts.push({ type: "text", value: before });

                parts.push({
                    type: "tokenNode",
                    data: { hName: "tokenNode", hProperties: { tokenType: match[1], tokenValue: match[2] } },
                });

                lastIndex = match.index + match[0].length;
            }

            const tail = value.slice(lastIndex).replace(/\\([{}])/g, "$1");
            if (tail) parts.push({ type: "text", value: tail });

            if (parts.length > 0 && parent && Array.isArray(parent.children)) {
                parent.children.splice(index, 1, ...parts);
                return index + parts.length;
            }
        });
    };
}

function BuildItem({ id }) {
    const [build, setBuild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [invalid, setInvalid] = useState(false);

    useEffect(() => {
        setLoading(true);
        getFilteredBuilds({ "build_id": id }, true).then(x => {
            if (x.length > 0) setBuild(x[0]);
            else setInvalid(true);
            setLoading(false);
        })
    }, [id])

    return loading ?
        <span>{"{build loading...}"}</span> :
        invalid ?
            <span>{`{build:${id}}`}</span> :
            <span>
                <Link href={`/builds/${id}`} data-tooltip-id={`markdown-build-tooltip`} data-tooltip-content={encodeURIComponent(JSON.stringify(build))}>
                    {build.title}
                </Link>
            </span>
}

export default function MarkdownRenderer({ content }) {
    const [identities, identitiesLoading] = useData("identities_mini");
    const [egos, egosLoading] = useData("egos_mini");
    const [statuses, statusesLoading] = useData("statuses");

    const renderedMarkdown = useMemo(() => {
        if (identitiesLoading || egosLoading || statusesLoading) return null;
        return <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks, tokenExtractionPlugin]}
            components={{
                tokenNode: ({ node }) => {
                    const { tokenType, tokenValue } = node.properties;

                    switch (tokenType) {
                        case "identity":
                            if (tokenValue in identities)
                                return <Link href={`/identities/${tokenValue}`} data-tooltip-id="identity-tooltip" data-tooltip-content={tokenValue}>
                                    [{sinnerMapping[identities[tokenValue].sinnerId]}] {identities[tokenValue].name}
                                </Link>;
                            else
                                return <span>{`{${tokenType}:${tokenValue}}`}</span>;
                        case "ego":
                            if (tokenValue in egos)
                                return <Link href={`/egos/${tokenValue}`} data-tooltip-id="ego-tooltip" data-tooltip-content={tokenValue}>
                                    [{sinnerMapping[egos[tokenValue].sinnerId]}] {egos[tokenValue].name}
                                </Link>;
                            else
                                return <span>{`{${tokenType}:${tokenValue}}`}</span>;
                        case "status":
                            if (tokenValue in statuses)
                                return <Status id={tokenValue} status={statuses[tokenValue]} includeTooltip={true} />;
                            else
                                return <span>{`{${tokenType}:${tokenValue}}`}</span>;
                        case "keyword":
                            const path = keywordIconConvert(tokenValue);
                            if (path)
                                return <Icon path={path} style={{ display: "inline-block", width: "2rem", height: "2rem", verticalAlign: "middle" }} />;
                            else
                                return <span>{`{${tokenType}:${tokenValue}}`}</span>;
                        case "build":
                            return <BuildItem id={tokenValue} />;
                        case "user":
                            return <Link href={`/profiles/${tokenValue}`}>{tokenValue}</Link>;
                        case "sinner":
                            try {
                                return <span>{sinnerMapping[parseInt(tokenValue)]}</span>;
                            } catch (err) {
                                return <span>{`{${tokenType}:${tokenValue}}`}</span>;
                            }
                        default:
                            return <span>{`{${tokenType}:${tokenValue}}`}</span>;
                    }
                },
                p: ({ node, ...props }) => (
                    <p style={{ margin: 0 }} {...props} />
                )
            }}
        >
            {content}
        </ReactMarkdown>
    }, [content, identities, identitiesLoading, egos, egosLoading, statuses, statusesLoading]);

    return identitiesLoading || egosLoading || statusesLoading ?
        <div>Loading...</div> :
        <div>
            <div style={{ lineHeight: "1.4", textAlign: "justify" }}>
                {renderedMarkdown}
            </div>

            <Tooltip
                id="markdown-build-tooltip"
                render={({ content }) => <div style={tooltipStyle}>
                    <BuildEntry build={JSON.parse(decodeURIComponent(content))} />
                </div>}
                getTooltipContainer={() => document.body}
                style={{ backgroundColor: "transparent", zIndex: "9999" }}
            />
        </div>

}