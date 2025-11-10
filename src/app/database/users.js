import supabase from "./connection";

async function checkUsername(username) {
    const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .maybeSingle();

    if (user) return true;
    else return false;
}

export { checkUsername };
