import { getSupabase } from './lib/supabase.js';

function checkAuth(req) {
  return req.headers.authorization === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export default async function handler(req, res) {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = getSupabase();

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'global')
        .single();

      if (error) throw error;
      return res.status(200).json(data || { ai_mode: true });
    }

    if (req.method === 'PATCH') {
      const { ai_mode } = req.body || {};
      if (typeof ai_mode !== 'boolean') {
        return res.status(400).json({ error: 'ai_mode (boolean) required' });
      }

      const { data, error } = await supabase
        .from('settings')
        .upsert({ id: 'global', ai_mode, updated_at: new Date().toISOString() }, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('settings error:', err);
    return res.status(500).json({ error: err.message });
  }
}
