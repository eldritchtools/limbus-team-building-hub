"use client";

import { getSupabase } from "./connection";

async function isSaved(id, user_id) {
    const { data: save } = await getSupabase()
        .from("saves")
        .select("*")
        .eq("build_id", id)
        .eq("user_id", user_id)
        .maybeSingle();

    if (save) return true;
    else return false;
}

async function insertSave(build_id) {
    const { error } = await getSupabase().from("saves").insert({ build_id });

    if (error) throw error;
    return { saved: true };
}

async function deleteSave(build_id) {
    const { error } = await getSupabase().from("saves").delete().eq("build_id", build_id);

    if (error) throw error;
    return { saved: false };
}

async function getSaves(user_id, page = 1, pageSize = 20) {
    const { data, error } = await getSupabase().rpc("get_saved_builds", {
        p_user_id: user_id,
        limit_count: pageSize,
        offset_count: (page - 1) * pageSize
    })

    if (error) throw error;
    return data;
}

export { isSaved, insertSave, deleteSave, getSaves };
