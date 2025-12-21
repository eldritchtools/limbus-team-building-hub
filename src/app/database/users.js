"use client";

import { getSupabase } from "./connection";

async function getUserFromUsername(username) {
    const { data: user } = await getSupabase()
        .from("users")
        .select("*")
        .eq("username", username)
        .maybeSingle();

    if (user) return user;
    else return null;
}

async function updateUser(userId, flair, description) {
    const update = {
        flair: flair.trim(),
        description: description.trim()
    };

    const { data, error } = await getSupabase()
        .from("users")
        .update(update)
        .eq("id", userId)

    if (error) throw error;
    return data;
}

export { getUserFromUsername, updateUser };
