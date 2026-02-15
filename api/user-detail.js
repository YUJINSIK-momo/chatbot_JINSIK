import { getSupabase } from './lib/supabase.js';

function checkAuth(req) {
  return req.headers.authorization === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export default async function handler(req, res) {
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const userId = req.query.userId || req.body?.userId;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const supabase = getSupabase();

    if (req.method === 'GET') {
      const { data: user, error: userErr } = await supabase
        .from('users')
        .select('*')
        .eq('line_user_id', userId)
        .single();
      if (userErr && userErr.code !== 'PGRST116') throw userErr;
      if (!user) return res.status(404).json({ error: 'User not found' });

      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      return res.status(200).json({ ...user, messages: messages || [] });
    }

    if (req.method === 'PATCH') {
      const { memo } = req.body || {};
      const updates = { updated_at: new Date().toISOString() };
      if (typeof memo === 'string') updates.memo = memo;

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('line_user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('user-detail error:', err);
    return res.status(500).json({ error: err.message });
  }
}
