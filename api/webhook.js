/**
 * LINE Messaging API Webhook
 * - DB에 사용자/메시지 저장
 * - AI 모드: 자동 응답 | CS 모드: 관리자 응답 대기
 */

import crypto from 'crypto';
import { getSupabase } from './lib/supabase.js';
import { replyToLine } from './lib/line.js';

function getAccessoryResponse(userMessage) {
  const msg = (userMessage || '').toLowerCase().trim();
  if (/안녕|하이|hello|hi|반가워/.test(msg)) return '안녕하세요! 👋 액세서리 상담 챗봇입니다. 귀걸이, 목걸이, 반지 등 무엇이든 물어보세요!';
  if (/귀걸이|이어링|피어싱/.test(msg)) {
    if (/스타일|추천|어떤/.test(msg)) return '귀걸이 스타일 추천드려요! 💎\n\n• 피스: 데일리 캐주얼\n• 드롭: 정장/파티\n• 후프: 클래식\n• 스터드: 미니멀';
    if (/관리|청소|보관/.test(msg)) return '귀걸이 관리 팁 ✨\n• 착용 후 천으로 닦기\n• 젖은 상태 보관 금지\n• 보석류 별도 보관';
    return '귀걸이 스타일 추천, 관리법 등 질문해주세요!';
  }
  if (/목걸이|넥리스|체인/.test(msg)) {
    if (/길이|cm/.test(msg)) return '목걸이 길이 💫\n• 35-40cm: 촤커\n• 42-48cm: 프린세스(인기)\n• 50-60cm: 매틴\n• 70cm+: 오페라/로프';
    return '목걸이 길이, 소재, 스타일링 질문해주세요.';
  }
  if (/반지|링게/.test(msg)) {
    if (/사이즈|핏/.test(msg)) return '반지 사이즈 📏\n1. 반지 게이지 2. 실로 둘레 측정 3. 기존 반지 직경 4. 한국 44~70번';
    return '반지 사이즈, 소재 등 질문해주세요.';
  }
  if (/팔찌|브레이슬릿/.test(msg)) return '팔찌: 뱅글, 체인, 비즈, 커프스 등';
  if (/브로치|핀|배지/.test(msg)) return '브로치: 재킷, 가방, 스카프, 모자에 활용';
  if (/금|은|실버|골드|스테인리스|진주/.test(msg)) return '소재: 14K골드, 순은925, 스테인리스, 진주 등';
  if (/감사|고마워|thanks/.test(msg)) return '천만에요! 😊';
  return `'${userMessage}' 관련 - 귀걸이, 목걸이, 반지 등 액세서리 질문에 답변해드려요! 💍✨`;
}

function verifySignature(body, signature) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) return false;
  const hash = crypto.createHmac('sha256', secret).update(body).digest('base64');
  return hash === signature;
}

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', message: 'LINE Webhook - 액세서리 챗봇 CRM' });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rawBody = await getRawBody(req);
  const signature = req.headers['x-line-signature'];
  if (!signature || !verifySignature(rawBody, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const body = JSON.parse(rawBody);
  if (!body.events || body.events.length === 0) {
    return res.status(200).send('OK');
  }

  res.status(200).send('OK');

  let supabase;
  try {
    supabase = getSupabase();
  } catch (e) {
    console.error('Supabase not configured:', e.message);
  }

  const { data: settings } = supabase ? await supabase.from('settings').select('ai_mode').eq('id', 'global').single() : { data: null };
  const aiMode = settings?.ai_mode !== false;

  for (const event of body.events) {
    const userId = event.source?.userId;
    if (!userId) continue;

    let dbUser = null;

    if (event.type === 'message' && event.message?.type === 'text') {
      const text = event.message.text;
      const replyToken = event.replyToken;

      if (supabase) {
        let { data: user } = await supabase.from('users').select('id').eq('line_user_id', userId).single();
        if (!user) {
          const { data: newUser, error: insErr } = await supabase.from('users').insert({
            line_user_id: userId,
            display_name: null,
            picture_url: null,
          }).select('id').single();
          if (insErr) console.error('insert user:', insErr);
          user = newUser;
        }
        dbUser = user;
        if (user) {
          await supabase.from('messages').insert({ user_id: user.id, content: text, direction: 'in' });
          await supabase.from('users').update({ updated_at: new Date().toISOString() }).eq('id', user.id);
        }
      }

      if (aiMode) {
        try {
          const reply = getAccessoryResponse(text);
          await replyToLine(replyToken, reply);
          if (supabase && dbUser) {
            await supabase.from('messages').insert({ user_id: dbUser.id, content: reply, direction: 'out' });
          }
        } catch (e) {
          console.error('reply error:', e);
        }
      }
    } else if (event.type === 'follow') {
      if (supabase) {
        await supabase.from('users').upsert({
          line_user_id: userId,
          display_name: null,
          picture_url: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'line_user_id' });
      }
      try {
        await replyToLine(
          event.replyToken,
          '안녕하세요! 👋 액세서리 상담 챗봇입니다. 귀걸이, 목걸이, 반지 등 질문해주세요!'
        );
      } catch (e) {
        console.error('follow reply:', e);
      }
    }
  }
}
