import { kv } from '@vercel/kv';

const BAD_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy',
  'whore', 'slut', 'nigger', 'nigga', 'fag', 'faggot', 'retard', 'rape',
  'cock', 'twat', 'piss', 'damn', 'crap', 'hoe', 'kike', 'chink', 'spic'
];

function normalizeForFilter(s) {
  return String(s)
    .toLowerCase()
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a')
    .replace(/5/g, 's').replace(/7/g, 't').replace(/\$/g, 's').replace(/@/g, 'a')
    .replace(/[^a-z]/g, '');
}
function containsBadWord(s) {
  const norm = normalizeForFilter(s);
  return BAD_WORDS.some((w) => norm.includes(w));
}
function randId(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { code, username, answers } = req.body || {};
    const c = String(code || '').toUpperCase();

    if (!c) return res.status(400).json({ error: 'Missing quiz code.' });
    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'A username is required.' });
    }
    const name = username.trim().slice(0, 18);
    if (containsBadWord(name)) {
      return res.status(400).json({ error: "That username isn't allowed here — try another." });
    }
    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'Missing answers.' });
    }

    const quiz = await kv.get(`quiz:${c}`);
    if (!quiz) return res.status(404).json({ error: 'No quiz found with that code.' });

    // Server computes the score so it can't be tampered with client-side.
    let score = 0;
    let correctCount = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correct) {
        correctCount++;
        score += quiz.timed ? 750 : 1000;
      }
    });

    const participantId = 'p_' + randId(10);
    const sub = {
      code: c,
      participantId,
      username: name,
      answers,
      score,
      correctCount,
      total: quiz.questions.length,
      submittedAt: Date.now()
    };
    await kv.set(`submission:${c}:${participantId}`, sub);
    return res.status(200).json(sub);
  }

  if (req.method === 'GET') {
    const c = String(req.query.code || '').toUpperCase();
    const participantId = req.query.participantId ? String(req.query.participantId) : null;

    if (!c) return res.status(400).json({ error: 'Missing quiz code.' });

    if (participantId) {
      const sub = await kv.get(`submission:${c}:${participantId}`);
      if (!sub) return res.status(404).json({ error: 'Result not found.' });
      return res.status(200).json(sub);
    }

    const keys = await kv.keys(`submission:${c}:*`);
    const subs = [];
    for (const k of keys) {
      const s = await kv.get(k);
      if (s) subs.push(s);
    }
    subs.sort((a, b) => b.score - a.score || a.submittedAt - b.submittedAt);
    return res.status(200).json(subs);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json({ error: 'Method not allowed' });
}
