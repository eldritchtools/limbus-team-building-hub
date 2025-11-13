"use client";

import { getSupabase } from "./connection";

async function getNotifications(userId, limit=null) {
    let options = {p_user_id: userId};

    if (limit) options.p_limit = limit;
    
    const { data, error } = await getSupabase().rpc('get_user_notifications', options);

    if (error) throw error;
    return data;
}

async function setNotificationRead(id) {
    const { data, error } = await getSupabase()
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

    if (error) throw error;
    return data;
}

export { getNotifications, setNotificationRead };
