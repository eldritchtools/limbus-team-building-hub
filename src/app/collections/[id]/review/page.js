"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import MarkdownRenderer from "@/app/components/Markdown/MarkdownRenderer";
import ReactTimeAgo from "react-time-ago";
import { isLocalId } from "@/app/utils";
import MarkdownEditorWrapper from "@/app/components/Markdown/MarkdownEditorWrapper";
import Username from "@/app/components/Username";
import { useAuth } from "@/app/database/authProvider";
import { approveCollectionSubmission, getCollection, getCollectionSubmissions, rejectCollectionSubmission, rejectCollectionSubmissionsForTarget } from "@/app/database/collections";
import { useBreakpoint } from "@eldritchtools/shared-components";
import BuildEntry from "@/app/components/BuildEntry";
import "./Submission.css";
import NoPrefetchLink from "@/app/NoPrefetchLink";

function Submission({ submission, submissionIds, inList, handleApprove, handleReject, approved, rejected, submitting }) {
    const [editing, setEditing] = useState(false);
    const [note, setNote] = useState(submission.note);

    const style = useMemo(() => {
        if (approved) return { backgroundColor: "#052e16", border: "1px solid #166534" };
        if (rejected) return { backgroundColor: "#2c0a0a", border: "1px solid #7f1d1d" };
        return {}
    }, [approved, rejected]);

    if (editing) {
        return <div className="submission-editing" style={style}>
            <div>
                Submitted by <Username username={submission.submitter.username} flair={submission.submitter.flair} clickable={false} />
            </div>
            <span style={{ fontSize: "1.2rem" }}>Description</span>
            <MarkdownEditorWrapper value={note} onChange={setNote} />
            <span style={{ fontSize: "1.2rem" }}>Submitter Note</span>
            <div>
                {submission.submitter_note}
            </div>
            <span style={{ fontSize: "1rem", color: "#aaa" }}>
                On approving a submission, the build will be added to your curated list and all other submissions for the same build will be rejected. The description and ordering of builds can be adjusted by editing the curated list afterwards.
            </span>
            <div style={{ display: "flex" }}>
                <button disabled={submitting} onClick={() => { handleApprove(submission.submission_id, note, submissionIds); setEditing(false); }}>Approve</button>
                <button disabled={submitting} onClick={() => { handleReject(submission.submission_id); setEditing(false); }}>Reject</button>
            </div>
        </div>
    } else {
        return <div className="submission" style={style} onClick={() => { if (!inList && !approved && !rejected) setEditing(true) }}>
            <div>
                Submitted by <Username username={submission.submitter.username} flair={submission.submitter.flair} clickable={false} />
            </div>
            <span style={{ fontSize: "1.2rem" }}>Description</span>
            <MarkdownRenderer content={note} />
            <span style={{ fontSize: "1.2rem" }}>Submitter Note</span>
            <div>
                {submission.submitter_note}
            </div>
            {approved || rejected ?
                null :
                <div style={{ display: "flex" }}>
                    <button disabled={submitting} onClick={(e) => {e.stopPropagation(); handleReject(submission.submission_id);}}>Reject</button>
                </div>
            }
        </div>
    }
}

function SubmissionSet({ build, submissions, inList, handleApprove, handleReject, handleRejectAll, approvedIds, rejectedIds, submitting }) {
    const submissionIds = useMemo(() => submissions.map(x => x.submission_id), [submissions]);
    const anyApproved = useMemo(() => submissions.find(x => approvedIds.has(x.submission_id)) !== undefined, [submissions, approvedIds]);

    return <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
            <BuildEntry build={build} size={"M"} complete={false} clickable={false} />
            {inList ?
                <span style={{ fontSize: "1rem", color: "#aaa" }}>
                    This build is already in this curated list. Submissions can only be rejected.
                </span> :
                null
            }
            <div>
                <button disabled={submitting || anyApproved} onClick={() => handleRejectAll(build.id, submissionIds)}>Reject All Submissions for this Build</button>
            </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {submissions.map(submission =>
                <Submission
                    key={submission.submission_id}
                    submission={submission}
                    submissionIds={submissionIds}
                    inList={inList}
                    handleApprove={handleApprove}
                    handleReject={handleReject}
                    approved={approvedIds.has(submission.submission_id)}
                    rejected={rejectedIds.has(submission.submission_id)}
                    submitting={submitting}
                />
            )}
        </div>
    </div>
}

export default function ReviewCuratedListPage({ params }) {
    const { id } = React.use(params);
    const [curatedList, setCuratedList] = useState(null);
    const [listLoading, setListLoading] = useState(true);
    const [submissions, setSubmissions] = useState(null);
    const [submissionsLoading, setSubmissionsLoading] = useState(true);
    const [setIndex, setSetIndex] = useState(0);
    const [approved, setApproved] = useState(new Set());
    const [rejected, setRejected] = useState(new Set());
    const [submitting, setSubmitting] = useState(false);

    const { user } = useAuth();
    const router = useRouter();
    const { isMobile } = useBreakpoint();

    useEffect(() => {
        if (isLocalId(id) || !user) router.back();

        const handleList = list => {
            if (!list) router.back();
            if (list.username) {
                setCuratedList(list);
                setListLoading(false);
            }
        }

        getCollection(id).then(handleList).catch(_err => {
            router.push(`/curated-lists/${listId}`);
        });

        const handleSubmissions = submissions => {
            setSubmissions(submissions);
            setSubmissionsLoading(false);
        }

        getCollectionSubmissions(id).then(handleSubmissions).catch(_err => {
            router.push(`/curated-lists/${listId}`);
        });
    }, [id, router, user]);

    const handleApprove = async (submissionId, note, submissionIds) => {
        setSubmitting(true);
        await approveCollectionSubmission(submissionId, note);
        setApproved(p => new Set([...p, submissionId]));
        setRejected(p => new Set([...p, ...submissionIds.filter(x => x !== submissionId)]));
        setSubmitting(false);
    }

    const handleReject = async (submissionId) => {
        setSubmitting(true);
        await rejectCollectionSubmission(submissionId);
        setRejected(p => new Set([...p, submissionId]));
        setSubmitting(false);
    }

    const handleRejectAll = async (buildId, submissionIds) => {
        setSubmitting(true);
        await rejectCollectionSubmissionsForTarget(id, buildId);
        setRejected(p => new Set([...p, ...submissionIds]));
        setSubmitting(false);
    }

    const submissionsSorted = useMemo(() => {
        if (!curatedList || !submissions) return {};
        const sorted = {};
        submissions.forEach(submission => {
            if (submission.build_id in sorted) {
                const { build: rem, ...rest } = submission;
                sorted[submission.build_id].submissions.push(rest);
            } else {
                const { build: build, ...rest } = submission;
                sorted[submission.build_id] = {
                    build: build,
                    submissions: [rest],
                    inList: curatedList.items.find(x => x.build.id === submission.build_id) !== undefined
                };
            }
        });
        return Object.entries(sorted);
    }, [curatedList, submissions]);

    return listLoading || submissionsLoading ?
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: "1.5rem", fontWeight: "bold" }}>
            Loading...
        </div> :
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", containerType: "inline-size" }}>
            <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                <h2 style={{ fontSize: "1.2rem", margin: 0 }}>
                    Reviewing Submissions for Curated List
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

                {submissionsSorted.length > 0 ? <>
                    <span style={{ fontSize: "1rem", color: "#aaa" }}>
                        Clicking on a submission will let you edit the description before approving it. Approving a submission will automatically reject all other submissions for the same build.
                    </span>

                    <div style={{ alignSelf: "center" }}>
                        <button onClick={() => setSetIndex(p => p - 1)} disabled={setIndex === 0}>Previous pending submission</button>
                        <button onClick={() => setSetIndex(p => p + 1)} disabled={setIndex === submissionsSorted.length - 1}>Next pending submission</button>
                    </div>

                    <SubmissionSet
                        key={submissionsSorted[setIndex][0]}
                        build={submissionsSorted[setIndex][1].build}
                        submissions={submissionsSorted[setIndex][1].submissions}
                        inList={submissionsSorted[setIndex][1].inList}
                        handleApprove={handleApprove}
                        handleReject={handleReject}
                        handleRejectAll={handleRejectAll}
                        approvedIds={approved}
                        rejectedIds={rejected}
                        submitting={submitting}
                    />
                </> :
                    <span style={{ fontSize: "1rem", color: "#aaa", alignSelf: "center" }}>
                        No pending submissions.
                    </span>
                }
                <div style={{ border: "1px #777 solid" }} />
            </div>

            <div>
                <NoPrefetchLink href={`/curated-lists/${id}`} className="toggle-button" style={{ color: "#ddd", textDecoration: "none", fontSize: "1.2rem" }}>
                    Return to curated list
                </NoPrefetchLink>
            </div>
        </div>
}
