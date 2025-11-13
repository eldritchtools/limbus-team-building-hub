"use client";

import { getSupabase } from "./connection";

async function getNotifications(userId, limit=null) {
    let query = getSupabase()
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (limit) query = query.limit(limit);
    
    const { data, error } = await query;

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
