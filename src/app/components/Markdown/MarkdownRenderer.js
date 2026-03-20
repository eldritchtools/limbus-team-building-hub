"use client";

import { Gift, Icon, Status, useData } from "@eldritchtools/limbus-shared-library";
import { keywordIconConvert } from "../../keywordIds";
import { sinnerMapping } from "../../utils";
import { Tooltip } from "react-tooltip";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { visit } from "unist-util-visit";
import { useEffect, useMemo, useState } from "react";
import { getFilteredBuilds } from "../../database/builds";
import { tooltipStyle } from "../../styles";
import BuildEntry from "../BuildEntry";
import "./MarkdownRenderer.css";

import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { isTouchDevice } from "@eldritchtools/shared-components";
import TooltipLink from "../TooltipLink";
import { convertMarkdownAlias } from "./MarkdownAliases";
import NoPrefetchLink from "@/app/NoPrefetchLink";
import { searchCollections } from "@/app/database/collections";
import { searchMdPlans } from "@/app/database/mdPlans";
import Collection from "../Collection";
import MdPlan from "../MdPlan";

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
                    data: { hName: "tokenNode", hProperties: { tokenType: match[1], tokenValues: match[2].split(":") } },
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

function sanitizeUrl(url) {
    try {
        const parsed = new URL(url, "https://limbus-teams.eldritchtools.com/");

        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            return parsed.href;
        }
        return null;
    } catch {
        return null;
    }
}

function IdentityItem({ id }) {
    const [identities, identitiesLoading] = useData("identities_mini");
    if (identitiesLoading) {
        return <span>{"{Loading...}"}</span>
    } else {
        if (id in identities)
            return <TooltipLink href={`/identities/${id}`} tooltipId={"identity-tooltip"} tooltipContent={id}>
                [{sinnerMapping[identities[id].sinnerId]}] {identities[id].name}
            </TooltipLink>;
        else
            return <span>{`{identity:${id}}`}</span>;
    }
}

function EgoItem({ id }) {
    const [egos, egosLoading] = useData("egos_mini");
    if (egosLoading) {
        return <span>{"{Loading...}"}</span>
    } else {
        if (id in egos)
            return <TooltipLink href={`/egos/${id}`} tooltipId="ego-tooltip" tooltipContent={id}>
                [{sinnerMapping[egos[id].sinnerId]}] {egos[id].name}
            </TooltipLink>;
        else
            return <span>{`{ego:${id}}`}</span>;
    }
}

function StatusItem({ id }) {
    const [statuses, statusesLoading] = useData("statuses");
    if (statusesLoading) {
        return <span>{"{Loading...}"}</span>
    } else {
        if (id in statuses)
            return <Status id={id} status={statuses[id]} includeTooltip={true} />;
        else
            return <span>{`{status:${id}}`}</span>;
    }
}

function GiftNameItem({ val }) {
    const [gifts, giftsLoading] = useData("gifts");
    const split = val.split("|");
    const id = split[0];
    const enhanceRank = split.length > 1 ? split[1] : 0;

    const checkValidity = () => {
        if (!(id in gifts)) return false;
        const rank = Number(enhanceRank);
        if (isNaN(rank) || !Number.isInteger(rank) || rank >= gifts[id].names.length || rank < 0) return false;
        return true;
    }

    if (giftsLoading) {
        return <span>{"{Loading...}"}</span>
    } else {
        if (checkValidity())
            return <span style={{ display: "inline", textDecoration: "underline" }}>
                <Gift gift={gifts[id]} enhanceRank={Number(enhanceRank)} text={true} />
            </span>
        else {
            return <span>{`{giftname:${val}}`}</span>
        }
    }
}

function GiftIconsItem({ vals }) {
    const [gifts, giftsLoading] = useData("gifts");

    if (giftsLoading) {
        return <span>{"{Loading...}"}</span>
    } else {
        return <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
            {vals.map((val, i) => {
                const split = val.split("|");
                const id = split[0];
                const enhanceRank = split.length > 1 ? Number(split[1]) : 0;

                if (id in gifts && !isNaN(enhanceRank) && Number.isInteger(enhanceRank) && enhanceRank >= 0 && enhanceRank < gifts[id].names.length) {
                    return <Gift key={i} gift={gifts[id]} enhanceRank={enhanceRank} />
                } else {
                    return <Gift key={i} gift={null} />
                }
            })}
        </div>
    }
}

function BuildItem({ id }) {
    const [build, setBuild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [invalid, setInvalid] = useState(false);

    useEffect(() => {
        setLoading(true);
        getFilteredBuilds({ "build_ids": [id] }, true).then(x => {
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
                <TooltipLink href={`/builds/${id}`} tooltipId={`markdown-build-tooltip`} tooltipContent={encodeURIComponent(JSON.stringify(build))}>
                    {build.title}
                </TooltipLink>
            </span>
}

function CollectionItem({ id }) {
    const [collection, setCollection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [invalid, setInvalid] = useState(false);

    useEffect(() => {
        setLoading(true);
        searchCollections({ "collection_ids": [id] }, true).then(x => {
            if (x.length > 0) setCollection(x[0]);
            else setInvalid(true);
            setLoading(false);
        })
    }, [id])

    return loading ?
        <span>{"{collection loading...}"}</span> :
        invalid ?
            <span>{`{collection:${id}}`}</span> :
            <span>
                <TooltipLink href={`/collections/${id}`} tooltipId={`markdown-collection-tooltip`} tooltipContent={encodeURIComponent(JSON.stringify(collection))}>
                    {collection.title}
                </TooltipLink>
            </span>
}

function MdPlanItem({ id }) {
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [invalid, setInvalid] = useState(false);

    useEffect(() => {
        setLoading(true);
        searchMdPlans({ planIds: [id] }, true).then(x => {
            if (x.length > 0) setPlan(x[0]);
            else setInvalid(true);
            setLoading(false);
        })
    }, [id])

    return loading ?
        <span>{"{md plan loading...}"}</span> :
        invalid ?
            <span>{`{mdplan:${id}}`}</span> :
            <span>
                <TooltipLink href={`/md-plans/${id}`} tooltipId={`markdown-mdplan-tooltip`} tooltipContent={encodeURIComponent(JSON.stringify(plan))}>
                    {plan.title}
                </TooltipLink>
            </span>
}

export default function MarkdownRenderer({ content }) {
    const renderedMarkdown = useMemo(() => {
        return <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks, remarkMath, tokenExtractionPlugin]}
            rehypePlugins={[rehypeKatex]}
            skipHtml={true}
            components={{
                tokenNode: ({ node }) => {
                    const { tokenType, tokenValues } = node.properties;

                    switch (convertMarkdownAlias(tokenType)) {
                        case "identity":
                            return <IdentityItem id={tokenValues[0]} />;
                        case "ego":
                            return <EgoItem id={tokenValues[0]} />;
                        case "status":
                            return <StatusItem id={tokenValues[0]} />;
                        case "keyword":
                            const path = keywordIconConvert(tokenValues[0]);
                            if (path)
                                return <Icon path={path} style={{ display: "inline-block", width: "2rem", height: "2rem", verticalAlign: "middle" }} />;
                            else
                                return <span>{`{${tokenType}:${tokenValues[0]}}`}</span>;
                        case "giftname":
                            return <GiftNameItem val={tokenValues[0]} />
                        case "gifticons":
                            return <GiftIconsItem vals={tokenValues} />
                        case "build":
                            return <BuildItem id={tokenValues[0]} />;
                        case "collection":
                            return <CollectionItem id={tokenValues[0]} />;
                        case "mdplan":
                            return <MdPlanItem id={tokenValues[0]} />;
                        case "user":
                            return <NoPrefetchLink href={`/profiles/${tokenValues[0]}`}>{tokenValues[0]}</NoPrefetchLink>;
                        case "sinner":
                            try {
                                return <span>{sinnerMapping[parseInt(tokenValues[0])]}</span>;
                            } catch (err) {
                                return <span>{`{${tokenType}:${tokenValues[0]}}`}</span>;
                            }
                        default:
                            return <span>{`{${tokenType}:${tokenValues.join(":")}}`}</span>;
                    }
                },
                p: ({ node, ...props }) => (
                    <p className="markdown-p" {...props} />
                ),
                a: ({ node, ...props }) => {
                    const safe = sanitizeUrl(props.href);
                    if (!safe) return <span>[invalid link]</span>;
                    return (
                        <a href={safe} target="_blank" rel="nofollow ugc">
                            {props.children}
                        </a>
                    );
                },
                blockquote: ({ node, ...props }) => (
                    <blockquote
                        style={{
                            borderLeft: "4px solid #ccc",
                            paddingLeft: "1rem",
                            margin: "1rem 0",
                            color: "#bbb",
                            fontStyle: "italic",
                        }}
                        {...props}
                    />
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    }, [content]);

    return <div>
        <div style={{ lineHeight: "1.4", textAlign: "justify", wordWrap: "break-word", overflowWrap: "break-word", wordBreak: "break-word" }}>
            {renderedMarkdown}
        </div>

        <Tooltip
            id="markdown-build-tooltip"
            render={({ content }) => {
                const build = JSON.parse(decodeURIComponent(content));
                if (build)
                    return <div style={{ ...tooltipStyle, width: isTouchDevice() ? "332px" : "460px" }}>
                        <BuildEntry build={build} size={"M"} complete={false} />
                    </div>
                return null;
            }}
            getTooltipContainer={() => document.body}
            style={{ backgroundColor: "transparent", zIndex: "9999" }}
            clickable={isTouchDevice()}
        />

        <Tooltip
            id="markdown-collection-tooltip"
            render={({ content }) => {
                const collection = JSON.parse(decodeURIComponent(content));
                if (collection)
                    return <div style={{ ...tooltipStyle, width: isTouchDevice() ? "350px" : "750px" }}>
                        <Collection collection={collection} complete={false} />
                    </div>
                return null;
            }}
            getTooltipContainer={() => document.body}
            style={{ backgroundColor: "transparent", zIndex: "9999" }}
            clickable={isTouchDevice()}
        />

        <Tooltip
            id="markdown-mdplan-tooltip"
            render={({ content }) => {
                const plan = JSON.parse(decodeURIComponent(content));
                if (plan)
                    return <div style={{ ...tooltipStyle, width: isTouchDevice() ? "175px" : "250px" }}>
                        <MdPlan plan={plan} complete={false} />
                    </div>
                return null;
            }}
            getTooltipContainer={() => document.body}
            style={{ backgroundColor: "transparent", zIndex: "9999" }}
            clickable={isTouchDevice()}
        />
    </div>

}