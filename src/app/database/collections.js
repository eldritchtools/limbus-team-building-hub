import { getSupabase } from "./connection";

async function searchCollections(filters, isPublished = true, sortBy = "score", page = 1, pageSize = 10) {
    const start = (page - 1) * pageSize;

    const options = {};
    if ("query" in filters) options["p_query"] = filters["query"];
    if ("collection_ids" in filters) options["collection_id_filter"] = filters["collection_id"];
    if ("user_id" in filters) options["user_id_filter"] = filters["user_id"];
    if ("username_exact" in filters) options["username_exact_filter"] = filters["username_exact"];
    if ("tags" in filters) options["tag_filter"] = filters["tags"];
    if ("ignore_block_discovery" in filters) options["p_ignore_block_discovery"] = filters["ignore_block_discovery"];
    options.p_published = isPublished;
    options.p_sort_by = sortBy;
    options.p_limit = pageSize;
    options.p_offset = start;

    const { data, error } = await getSupabase().rpc('search_collections_v1', options);

    if (error) throw (error);
    return data;
}

async function getCollection(id) {
    const { data, error } = await getSupabase().rpc("get_collection_v1", {
        p_list_id: id,
    });

    if (error) throw error;
    return data;
}

async function insertCollection(title, body, short_desc, items, submission_mode, tags, block_discovery, is_published) {
    const { data, error } = await getSupabase().rpc('create_collection_v1', {
        p_title: title,
        p_body: body,
        p_short_desc: short_desc,
        p_submission_mode: submission_mode,
        p_is_published: is_published,
        p_block_discovery: block_discovery,
        p_items: items,
        p_tags: tags
    });

    if (error) throw (error);
    return data;
}

async function updateCollection(collection_id, title, body, short_desc, items, submission_mode, tags, block_discovery, is_published) {
    const { error } = await getSupabase().rpc('update_collection_v1', {
        p_collection_id: collection_id,
        p_title: title,
        p_body: body,
        p_short_desc: short_desc,
        p_submission_mode: submission_mode,
        p_is_published: is_published,
        p_block_discovery: block_discovery,
        p_items: items,
        p_tags: tags
    });

    if (error) throw (error);
    return collection_id;
}

async function deleteCollection(collection_id) {
    const { error } = await getSupabase().from("collections").delete().eq("id", collection_id);

    if (error) throw error;
    return { deleted: true };
}


async function pinCollectionComment(collectionId, commentId) {
    const { error } = await getSupabase().from('collections').update({ pinned_comment_id: commentId }).eq('id', collectionId);

    if (error) {
        console.error('Error pinning comment:', error);
        return null;
    }

    return true;
}

async function unpinCollectionComment(collectionId) {
    const { error } = await getSupabase().from('collections').update({ pinned_comment_id: null }).eq('id', collectionId)

    if (error) {
        console.error('Error unpinning comment:', error);
        return null;
    }

    return true;
}

async function submitCollectionContribution(user_id, collection_id, target_type, target_id, note, submitter_note) {
    try {
        const { data, error } = await getSupabase()
            .from("collection_submissions")
            .insert({
                collection_id: collection_id,
                target_type: target_type,
                target_id: target_id,
                note: note,
                submitter_note: submitter_note,
                submitted_by: user_id
            });

        if (error) throw error;
        return "Success";

    } catch (err) {
        if (err.code === "23505") {
            return "You have a pending submission for this item on this collection.";
        } else {
            return "Something went wrong while submitting.";
        }
    }
}

async function getCollectionSubmissions(id) {
    const { data, error } = await getSupabase().rpc("get_collection_submissions", {
        p_collection_id: id,
    });

    if (error) throw error;
    return data;
}

async function approveCollectionSubmission(id, note) {
    const { data, error } = await getSupabase().rpc("approve_collection_submission", {
        p_submission_id: id,
        p_note: note
    });

    if (error) throw error;
    return data;
}

async function rejectCollectionSubmission(id) {
    const { data, error } = await getSupabase().rpc("reject_collection_submission", {
        p_submission_id: id
    });

    if (error) throw error;
    return data;
}

async function rejectCollectionSubmissionsForTarget(collection_id, build_id) {
    const { data, error } = await getSupabase().rpc("reject_collection_submissions_for_target", {
        p_collection_id: collection_id,
        p_build_id: build_id
    });

    if (error) throw error;
    return data;
}

async function getCollectionsForSitemap(page, count) {
    const offset = (page - 1) * count;
    const { data, error } = await getSupabase()
        .from('collections')
        .select('id, created_at, updated_at')
        .eq('is_published', true)
        .order('created_at', { ascending: true })
        .range(offset, offset + count - 1);

    if (error) throw (error);
    return data;
}

async function getCollectionsCountForSitemap() {
    const { count, error } = await getSupabase()
        .from('collections')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

    if (error) throw (error);
    return count;
}

export {
    searchCollections, getCollection, insertCollection, updateCollection, deleteCollection,
    pinCollectionComment, unpinCollectionComment,
    submitCollectionContribution, getCollectionSubmissions, approveCollectionSubmission, rejectCollectionSubmission, rejectCollectionSubmissionsForTarget,
    getCollectionsForSitemap, getCollectionsCountForSitemap
};
