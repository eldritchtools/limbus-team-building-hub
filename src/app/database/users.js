"use client";

import { getSupabase } from "./connection";

async function checkUsername(username) {
    const { data: user } = await getSupabase()
        .from("users")
        .select("*")
        .eq("username", username)
        .maybeSingle();

    if (user) return true;
    else return false;
}

export { checkUsername };
