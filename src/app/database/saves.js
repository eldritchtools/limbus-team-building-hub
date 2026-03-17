"use client";

import { getSupabase } from "./connection";

async function getSavedBuilds(user_id, page = 1, pageSize = 20) {
    const { data, error } = await getSupabase().rpc("get_saved_builds_v3", {
        p_user_id: user_id,
        limit_count: pageSize,
        offset_count: (page - 1) * pageSize
    })

    if (error) throw error;
    return data;
}

async function getSavedCuratedLists(user_id, page = 1, pageSize = 10) {
    const { data, error } = await getSupabase().rpc("get_saved_build_lists", {
        p_user_id: user_id,
        p_limit: pageSize,
        p_offset: (page - 1) * pageSize
    })

    if (error) throw error;
    return data;
}

async function getSavedMdPlans(user_id, page = 1, pageSize = 20) {
    const { data, error } = await getSupabase().rpc("get_saved_md_plans", {
        p_user_id: user_id,
        p_sort_by: null,
        p_limit: pageSize,
        p_offset: (page - 1) * pageSize
    })

    if (error) throw error;
    return data;
}

export { getSavedBuilds, getSavedCuratedLists, getSavedMdPlans };
