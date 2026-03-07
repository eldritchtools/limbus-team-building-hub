import { getSupabase } from "./connection";

async function searchCuratedLists(filters, isPublished = true, sortBy = "score", page = 1, pageSize = 10) {
    const start = (page - 1) * pageSize;

    const options = {};
    if ("query" in filters) options["p_query"] = filters["query"];
    if ("user_id" in filters) options["user_id_filter"] = filters["user_id"];
    if ("username_exact" in filters) options["username_exact_filter"] = filters["username_exact"];
    if ("tags" in filters) options["tag_filter"] = filters["tags"];
    if ("ignore_block_discovery" in filters) options["p_ignore_block_discovery"] = filters["ignore_block_discovery"];
    options.p_published = isPublished;
    options.p_sort_by = sortBy;
    options.p_limit = pageSize;
    options.p_offset = start;

    const { data, error } = await getSupabase().rpc('search_build_lists', options);

    if (error) throw (error);
    return data;
}

async function getCuratedList(id) {
    const { data, error } = await getSupabase().rpc("get_build_list", {
        p_list_id: id,
    });

    if (error) throw error;
    return data;
}

async function insertCuratedList(title, body, short_desc, items, tags, block_discovery, is_published) {
    const { data, error } = await getSupabase().rpc('create_build_list', {
        p_title: title,
        p_body: body,
        p_short_desc: short_desc,
        p_is_published: is_published,
        p_block_discovery: block_discovery,
        p_items: items,
        p_tags: tags
    });

    if (error) throw (error);
    return data;
}

async function updateCuratedList(list_id, title, body, short_desc, items, tags, block_discovery, is_published) {
    const { error } = await getSupabase().rpc('update_build_list', {
        p_list_id: list_id,
        p_title: title,
        p_body: body,
        p_short_desc: short_desc,
        p_is_published: is_published,
        p_block_discovery: block_discovery,
        p_items: items,
        p_tags: tags
    });

    if (error) throw (error);
    return list_id;
}

async function deleteCuratedList(list_id) {
    const { error } = await getSupabase().from("build_lists").delete().eq("id", list_id);

    if (error) throw error;
    return { deleted: true };
}

async function getCuratedListsForSitemap(page, count) {
    const offset = (page - 1) * count;
    const { data, error } = await getSupabase()
        .from('build_lists')
        .select('id, created_at, updated_at')
        .eq('is_published', true)
        .order('created_at', { ascending: true })
        .range(offset, offset + count - 1);

    if (error) throw (error);
    return data;
}

async function getCuratedListsCountForSitemap() {
    const { count, error } = await getSupabase()
        .from('build_lists')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

    if (error) throw (error);
    return count;
}

export { searchCuratedLists, getCuratedList, insertCuratedList, updateCuratedList, deleteCuratedList, getCuratedListsForSitemap, getCuratedListsCountForSitemap };
