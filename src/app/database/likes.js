import supabase from "./connection";

async function isLiked(id, user_id) {
    const { data: like } = await supabase
        .from("likes")
        .select("*")
        .eq("build_id", id)
        .eq("user_id", user_id)
        .maybeSingle();

    if (like) return true;
    else return false;
}

async function insertLike(build_id) {
    const { error } = await supabase.from("likes").insert({ build_id });

    if (error) throw error;
    return { liked: true };
}

async function deleteLike(build_id) {
    const { error } = await supabase.from("likes").delete().eq("build_id", build_id);

    if (error) throw error;
    return { liked: false };
}

export { isLiked, insertLike, deleteLike };
