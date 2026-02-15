import { getSupabase } from './lib/supabase.js';
import { pushToLine } from './lib/line.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (req.headers.authorization !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { userId, message } = req.body || {};
  if (!userId || !message || typeof message !== 'string') {
    return res.status(400).json({ error: 'userId and message required' });
  }

  try {
    const supabase = getSupabase();
    const { data: user } = await supabase.from('users').select('id').eq('line_user_id', userId).single();
    if (!user) return res.status(404).json({ error: 'User not found' });

    await pushToLine(userId, message.trim());
    await supabase.from('messages').insert({ user_id: user.id, content: message.trim(), direction: 'out' });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-message error:', err);
    return res.status(500).json({ error: err.message });
  }
}
