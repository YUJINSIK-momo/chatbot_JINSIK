import { getSupabase } from './lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (req.headers.authorization !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('users').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    return res.status(200).json(data || []);
  } catch (err) {
    console.error('users error:', err);
    return res.status(500).json({ error: err.message });
  }
}
