"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SelectBuildModal from "@/app/components/SelectBuildModal";
import MarkdownRenderer from "@/app/components/Markdown/MarkdownRenderer";
import ReactTimeAgo from "react-time-ago";
import { isLocalId } from "@/app/utils";
import MarkdownEditorWrapper from "@/app/components/Markdown/MarkdownEditorWrapper";
import Username from "@/app/components/Username";
import { useAuth } from "@/app/database/authProvider";
import { getCuratedList, submitBuildListContribution } from "@/app/database/curatedLists";
import { useBreakpoint } from "@eldritchtools/shared-components";
import BuildEntry from "@/app/components/BuildEntry";

export default function ContributeCuratedListPage({ params }) {
    const { id } = React.use(params);
    const [curatedList, setCuratedList] = useState(null);
    const [build, setBuild] = useState(null);
    const [note, setNote] = useState('');
    const [submitterNote, setSubmitterNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { user } = useAuth();
    const router = useRouter();
    const [selectBuildOpen, setSelectBuildOpen] = useState(false);
    const { isMobile } = useBreakpoint();

    useEffect(() => {
        if (isLocalId(id) || !user) router.back();

        const handleList = list => {
            if (!list || list.submission_mode !== "open") router.back();
            if (list.username) {
                setCuratedList(list);
                setLoading(false);
            }
        }

        getCuratedList(id).then(handleList).catch(_err => {
            router.push(`/curated-lists/${listId}`);
        });
    }, [id, router, user]);

    const handleSubmit = async () => {
        if (!build) {
            setMessage("A build must be selected.")
            return;
        }
        setSubmitting(true);

        const result = await submitBuildListContribution(user.id, id, build.id, note, submitterNote);
        if(result === "Success")
            router.push(`/curated-lists/${id}`);
        else {
            setMessage(result);
            setSubmitting(false);
        }
    }

    const alreadyInList = useMemo(() => {
        if (!build) return false;
        return curatedList.items.find(x => x.build.id === build.id) !== undefined;
    }, [curatedList, build]);

    return loading ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: "1.5rem", fontWeight: "bold" }}>
        Loading...
    </div> : <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", containerType: "inline-size" }}>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <h2 style={{ fontSize: "1.2rem", margin: 0 }}>
                Contributing to Curated List
            </h2>
            <h2 style={{ display: "flex", fontSize: "1.2rem", fontWeight: "bold", alignItems: "center" }}>
                {curatedList.title}
            </h2>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "0.9rem", marginBottom: "0.5rem", color: "#ddd" }}>
                    <span>by <Username username={curatedList.username} flair={curatedList.user_flair} /> • </span>
                    <ReactTimeAgo date={curatedList.published_at ?? curatedList.created_at} locale="en-US" timeStyle="mini" />
                    {curatedList.updated_at !== (curatedList.published_at ?? curatedList.created_at) ?
                        <span> • Last edited <ReactTimeAgo date={curatedList.updated_at} locale="en-US" timeStyle="mini" /></span> :
                        null}
                </div>
            </div>
        </div>

        <div style={{ height: "0.5rem" }} />
        <div style={{ display: "flex", flexDirection: "column", width: isMobile ? "100%" : "95%", alignSelf: "center", marginBottom: "1rem", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", paddingRight: "0.5rem", gap: "0.5rem", width: "100%" }}>
                <span style={{ fontSize: "1.2rem" }}>Curated List Description</span>
                <div className={{ maxWidth: "48rem", marginLeft: "auto", marginRight: "auto" }}>
                    <div>
                        <MarkdownRenderer content={curatedList.body} />
                    </div>
                </div>
            </div>

            <div style={{ border: "1px #777 solid" }} />

            <div>
                <button onClick={() => setSelectBuildOpen(true)}>Select a build to contribute</button>
            </div>

            {build ?
                <BuildEntry build={build} size={"M"} complete={false} clickable={false} />
                : null
            }
            {alreadyInList ?
                <span>Warning: This build is already included in this curated list and cannot be submitted.</span> :
                null
            }

            <span style={{ fontSize: "1.2rem" }}>Description:</span>
            <span style={{ fontSize: "1rem", color: "#aaa" }}>
                Description of the build to display on the curated list if approved. The owner may decide to edit this.
            </span>
            <div className={{ maxWidth: "48rem", marginLeft: "auto", marginRight: "auto" }}>
                <MarkdownEditorWrapper value={note} onChange={setNote} placeholder={"Describe your contribution here..."} />
            </div>

            <span style={{ fontSize: "1.2rem" }}>Submitter Note:</span>
            <span style={{ fontSize: "1rem", color: "#aaa" }}>
                Anything else you may want to convey to the owner for this contribution. This will not be displayed on the curated list if the submission is approved.
            </span>
            <textarea value={submitterNote} style={{ width: "min(100%, 85vw)", height: "5rem" }} onChange={e => setSubmitterNote(e.target.value)} />
        </div>

        <span style={{ fontSize: "1rem", color: "#aaa" }}>
            Contributions cannot be edited once submitted and you will not be allowed to submit the same build until it is approved or rejected. Please make sure the details are final before submitting.
        </span>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button style={{ padding: "0.5rem", fontSize: "1.2rem" }} onClick={() => handleSubmit()} disabled={submitting || alreadyInList}>Submit</button>
            <button style={{ padding: "0.5rem", fontSize: "1.2rem" }} onClick={() => router.back()} disabled={submitting}>Cancel</button>
            <span>{message}</span>
        </div>

        <SelectBuildModal
            isOpen={selectBuildOpen}
            onClose={() => setSelectBuildOpen(false)}
            onSelectBuild={build => { 
                setBuild(build); 
                setMessage("");
                setSelectBuildOpen(false); 
            }}
        />
    </div>
}
